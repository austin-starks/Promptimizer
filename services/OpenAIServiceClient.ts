import GenerativeAIServiceClient, {
  MESSAGE_LIMIT,
  transformMessageContent,
  transformSenderToRole,
} from "./GenerativeAIServiceClient";
import OpenAiChatLog, {
  OpenAIImageResponse,
  OpenAiChatMessage,
  OpenAiChatRequest,
  OpenAiChatResponse,
  OpenAiEmbeddingsRequest,
  OpenAiEmbeddingsResponse,
  OpenAiImageRequest,
} from "../models/aiChatLog/openai";
import axios, { AxiosResponse } from "axios";
import { extractJson, removeJson } from "../utils";

import { ChatMessage } from "../models/message";
import { ObjectId } from "../models/shared";
import { SendChatMessageRequest } from "../models/aiChatLog/shared";
import { Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

class OpenAIServiceClient extends GenerativeAIServiceClient {
  baseUrl: string = "https://api.openai.com/v1/chat/completions";

  async embeddings(prompt: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("API key for OpenAI is missing");
    }

    const requestPayload: OpenAiEmbeddingsRequest = {
      input: prompt,
      model: "text-embedding-ada-002",
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    try {
      const response = await axios.post<OpenAiEmbeddingsResponse>(
        "https://api.openai.com/v1/embeddings",
        requestPayload,
        { headers }
      );
      await OpenAiChatLog.logEmbeddingsChat(
        requestPayload,
        response.data,
        null
      );
      return response.data.data[0].embedding;
    } catch (error) {
      console.error(error);
      await OpenAiChatLog.logEmbeddingsChat(requestPayload, undefined, error);
      throw new Error(`Error in embeddings function: ${error.message}`);
    }
  }

  async analyzeImage(request: OpenAiImageRequest): Promise<string> {
    const { prompt, imageUrl } = request;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("API key for OpenAI is missing");
    }

    let imageContent:
      | {
          type: "image_url";
          image_url: {
            url: string;
          };
        }
      | {
          type: "image";
          image: string;
        };
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      // Treat as URL
      imageContent = {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      };
    } else {
      // Treat as base64 encoded image
      imageContent = {
        type: "image",
        image: `data:image/jpeg;base64,${imageUrl}`,
      };
    }

    // Create the payload
    const payload = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            imageContent,
          ],
        },
      ],
    };

    // Send request to OpenAI
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    let openAiResponse: AxiosResponse<OpenAIImageResponse> | undefined =
      undefined;
    try {
      openAiResponse = await axios.post(this.baseUrl, payload, { headers });
      await OpenAiChatLog.logImageChat(request, openAiResponse?.data, null);
      if (
        openAiResponse?.data.choices &&
        openAiResponse.data.choices.length > 0
      ) {
        return openAiResponse.data.choices[0].message.content;
      } else {
        throw new Error("No response from OpenAI.");
      }
    } catch (error) {
      await OpenAiChatLog.logImageChat(
        request,
        openAiResponse?.data,
        error.message
      );
      throw new Error("Error in chat function: " + error.message);
    }
  }

  async sendRequest(
    request: SendChatMessageRequest
  ): Promise<{ message: ChatMessage }> {
    const { systemPrompt, model, temperature, messages } = request;
    let systemPromptMessage = { sender: "system", content: systemPrompt };

    const response = await this.submitRequest(
      [systemPromptMessage, ...messages],
      model,
      temperature
    );
    let json = extractJson(response.choices[0].message.content);
    const message: ChatMessage = {
      _id: new Types.ObjectId(),
      sender: "AI Assistant",
      content: removeJson(response.choices[0].message.content),
      data: json,
    };
    return { message };
  }

  private async submitRequest(
    messages: ChatMessage[],
    model: string,
    temperature: number
  ) {
    const formattedMessages = messages
      .map(transformSenderToRole)
      .map(transformMessageContent);
    return await this.chat(formattedMessages, model, temperature);
  }

  private async chat(
    messages: OpenAiChatMessage[],
    model: string,
    temperature: number
  ): Promise<OpenAiChatResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("API key for OpenAI is missing");
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    let newMessages: OpenAiChatMessage[] = [...messages];
    if (messages.length - 1 > MESSAGE_LIMIT) {
      newMessages = [messages[0], ...messages.slice(-MESSAGE_LIMIT)];
    }
    const data: OpenAiChatRequest = {
      model: model,
      messages: newMessages,
      temperature: temperature,
    };

    const tryRequest = async (
      retryCount: number,
      delayMs: number,
      timeoutMs: number
    ): Promise<OpenAiChatResponse | undefined> => {
      while (retryCount >= 0) {
        try {
          const timeoutPromise = new Promise<AxiosResponse>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
          );
          const response = await Promise.race([
            axios.post(this.baseUrl, data, { headers }),
            timeoutPromise,
          ]);
          await OpenAiChatLog.logChat(data, response.data, null);
          return response.data;
        } catch (e) {
          console.log(
            "Error: \n",
            JSON.stringify(e?.response?.data || e.message, null, 2)
          );
          if (e?.response?.data?.error?.code === "context_length_exceeded") {
            const errorMessage =
              "I'm sorry. I have reached the maximum conversation length. I will continue to learn to have longer conversations in the future. To start a new conversation, please refresh the page.";

            await OpenAiChatLog.logChat(data, null, errorMessage);
            data.messages = data.messages.map((message) => {
              message.content = removeJson(message.content);
              return message;
            });
            if (retryCount === 0) {
              throw new Error(errorMessage);
            }
          }
          const errorMessage = e?.error?.message || e.message;
          await OpenAiChatLog.logChat(data, null, errorMessage);
          if (retryCount === 0) {
            console.log(e);
            throw new Error(
              `Request from OpenAI Service failed with error ${errorMessage}`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          retryCount -= 1;
          delayMs *= 2;
        }
      }
    };
    // Maximum 3 retries with an initial delay of 2 second and a 60 second timeout
    return tryRequest(3, 5000, 600000) as Promise<OpenAiChatResponse>;
  }
}

export default OpenAIServiceClient;
