import { AiChatTypeEnum, SendChatMessageRequest } from "./shared";
import mongoose, { Schema } from "mongoose";

import { OpenSourceImageModels } from "../prompts/abstract";

export interface OpenSourceImageRequest {
  imageUrl?: string;
  imageBuffer?: Buffer;
  model: OpenSourceImageModels; // either llava or bakllava
  prompt: string;
}

export interface OpenSourceImageResponse {
  response: string;
}

export interface OpenSourceChatResponse {
  message: {
    sender: "assistant";
    content: string;
  };
}

interface OpenSourceChatLog {
  type: AiChatTypeEnum;
  request: any;
  response: any;
  createdAt: Date;
  error?: string;
}

const OpenSourceChatLogModel = mongoose.model<
  OpenSourceChatLog & mongoose.Document
>(
  "OpenSourceChatLog",
  new Schema({
    type: { type: String, required: true },
    request: { type: Object, required: true },
    response: { type: Object },
    error: { type: String },
    createdAt: { type: Date, default: Date.now },
  })
);

class OpenSourceChatLog {
  static async logImageChat(
    request: OpenSourceImageRequest,
    response: OpenSourceImageResponse,
    error: string
  ) {
    if (error) {
      console.log("OpenAI Image Error: ", error);
    }
    const log = new OpenSourceChatLogModel({
      type: AiChatTypeEnum.Image,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }

  static async logEmbeddingsChat(
    input: string,
    embeddings: number[],
    error: string
  ) {
    if (error) {
      console.log("OpenAI Embedding Error: ", error);
    }
    const request = {
      input,
      model: "BAAI/bge-base-en-v1.5",
    };
    const response = {
      embeddings,
    };
    const log = new OpenSourceChatLogModel({
      type: AiChatTypeEnum.Embeddings,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }

  static async logChat(
    request: SendChatMessageRequest,
    response: OpenSourceChatResponse | null,
    error: string | null
  ) {
    if (error) {
      console.log("OpenAI Chat Error: ", error);
    }
    const log = new OpenSourceChatLogModel({
      type: AiChatTypeEnum.Chat,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }
}

export default OpenSourceChatLog;
