import GenerativeAIServiceClient, {
  MESSAGE_LIMIT,
  transformMessageContent,
  transformSenderToRole,
} from "./GenerativeAIServiceClient";
import OpenSourceChatLog, {
  OpenSourceChatResponse,
  OpenSourceImageRequest,
  OpenSourceImageResponse,
} from "../models/aiChatLog/opensource";
import axios, { AxiosResponse } from "axios";
import { extractJson, removeJson } from "../utils";

import { ChatMessage } from "../models/message";
import { OpenSourceImageModels } from "../models/prompts/abstract";
import { SendChatMessageRequest } from "../models/aiChatLog/shared";
import { Types } from "mongoose";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

class OpenSourceServiceClient extends GenerativeAIServiceClient {
  private validateImageRequest = (imageRequest: OpenSourceImageRequest) => {
    if (!Object.values(OpenSourceImageModels).includes(imageRequest.model)) {
      throw new Error("Image model is must be an open source image model");
    }
    if (!imageRequest.imageUrl && !imageRequest.imageBuffer) {
      throw new Error("Image URL or image buffer must be provided");
    }
    if (imageRequest.imageUrl && imageRequest.imageBuffer) {
      throw new Error("Only one of image URL or image buffer must be provided");
    }
    if (!imageRequest.prompt) {
      throw new Error("Prompt must be provided");
    }
  };

  analyzeImage = async (
    imageRequest: OpenSourceImageRequest
  ): Promise<string> => {
    this.validateImageRequest(imageRequest);
    let imageBuffer: Buffer = imageRequest.imageBuffer;
    if (!imageRequest.imageBuffer) {
      const response = await axios({
        method: "get",
        url: imageRequest.imageUrl,
        responseType: "arraybuffer",
      });
      imageBuffer = response.data;
    }
    imageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 }) // Resizing to width 800px, height will scale automatically
      .png()
      .toBuffer();
    const base64Image = imageBuffer.toString("base64");

    // Create the POST request payload
    const data = {
      model: imageRequest.model,
      prompt: imageRequest.prompt,
      images: [base64Image],
      stream: false,
    };
    let response: AxiosResponse<OpenSourceImageResponse>;
    try {
      response = await axios.post(
        `${process.env.OLLAMA_SERVICE_URL}/api/generate`,
        data,
        { headers: { "Content-Type": "application/json" } }
      );
      await OpenSourceChatLog.logImageChat(imageRequest, response.data, null);
    } catch (error) {
      await OpenSourceChatLog.logImageChat(
        imageRequest,
        response?.data,
        error.message
      );
      throw new Error("Error in analyze image function: " + error.message);
    }

    return response.data.response;
  };

  sendRequest = async (
    obj: SendChatMessageRequest
  ): Promise<{ message: ChatMessage }> => {
    let formattedMessages = [
      { sender: "system", content: obj.systemPrompt },
      ...obj.messages,
    ]
      .map(transformSenderToRole)
      .map(transformMessageContent);

    if (formattedMessages.length - 1 > MESSAGE_LIMIT) {
      formattedMessages = [
        formattedMessages[0],
        ...formattedMessages.slice(-MESSAGE_LIMIT),
      ];
    }
    const data = {
      model: obj.model,
      messages: formattedMessages,
      stream: false,
      options: {
        num_ctx: 32768,
      },
    };
    let response: AxiosResponse<OpenSourceChatResponse>;
    try {
      response = await axios.post(
        process.env.OLLAMA_SERVICE_URL + "/api/chat",
        data
      );
      await OpenSourceChatLog.logChat(obj, response.data, null);
      return {
        message: {
          _id: new Types.ObjectId().toHexString(),
          sender: "AI Assistant",
          content: removeJson(response.data.message.content),
          data: extractJson(response.data.message.content),
        },
      };
    } catch (error) {
      await OpenSourceChatLog.logChat(obj, response?.data, error.message);
      throw new Error("Error in chat function: " + error.message);
    }
  };

  embeddings = async (prompt: string): Promise<number[]> => {
    try {
      const response = await axios.post(
        process.env.OLLAMA_SERVICE_URL + "/api/embeddings",
        {
          prompt: prompt,
          model: "nomic-embed-text",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const embeddings = response.data.embedding;
      await OpenSourceChatLog.logEmbeddingsChat(prompt, embeddings, null);
      return embeddings;
    } catch (error) {
      await OpenSourceChatLog.logEmbeddingsChat(prompt, null, error.message);
      throw new Error("Error in embeddings function: " + error.message);
    }
  };
}

export default OpenSourceServiceClient;
