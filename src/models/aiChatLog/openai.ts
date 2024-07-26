import mongoose, { Schema } from "mongoose";

import { AiChatTypeEnum } from "./shared";
import { ObjectId } from "../shared";

export interface OpenAiChatMessage {
  role: string;
  content: string;
  function_call?: { name: string; arguments: string };
}

export interface OpenAiImageRequest {
  prompt: string;
  imageUrl: string;
}

export interface OpenAiEmbeddingsRequest {
  input: string;
  model: "text-embedding-ada-002";
}

export interface OpenAiEmbeddingsResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAiChatRequest {
  model: string;
  messages: OpenAiChatMessage[];
  temperature: number;

  function_call?: { name: string };
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: { type: "json_object" };
  seed?: number;
}

export interface OpenAiChoice {
  index: number;
  finish_reason: string;
  message: OpenAiChatMessage;
}

export interface OpenAiUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAiChatResponse {
  usage: OpenAiUsage;
  choices: OpenAiChoice[];
  created: number;
}

export interface OpenAIImageResponse {
  choices: OpenAiChoice[];
}

interface OpenAiChatLog {
  type: AiChatTypeEnum;
  request: OpenAiChatRequest | OpenAiImageRequest | OpenAiEmbeddingsRequest;
  response: OpenAiChatResponse | OpenAIImageResponse | OpenAiEmbeddingsResponse;
  createdAt: Date;
  error?: string;
}

const OpenAiChatLogModel = mongoose.model<OpenAiChatLog & mongoose.Document>(
  "OpenAIChatLog",
  new Schema({
    type: { type: String, required: true },
    request: { type: Object, required: true },
    response: { type: Object },
    error: { type: String },
    createdAt: { type: Date, default: Date.now },
  })
);

class OpenAiChatLog {
  static async logImageChat(
    request: OpenAiImageRequest,
    response: OpenAIImageResponse | undefined,
    error: string | null
  ) {
    if (error) {
      console.log("OpenAI Image Error: ", error);
    }
    const log = new OpenAiChatLogModel({
      type: AiChatTypeEnum.Image,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }

  static async logEmbeddingsChat(
    request: OpenAiEmbeddingsRequest,
    response: OpenAiEmbeddingsResponse | undefined,
    error: any
  ) {
    if (error) {
      console.log("OpenAI Embedding Error: ", error);
    }
    const log = new OpenAiChatLogModel({
      type: AiChatTypeEnum.Embeddings,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }

  static async logChat(
    request: OpenAiChatRequest,
    response: OpenAiChatResponse | null,
    error: string | null
  ) {
    if (error) {
      console.log("OpenAI Chat Error: ", error);
    }
    const log = new OpenAiChatLogModel({
      type: AiChatTypeEnum.Chat,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }
}

export default OpenAiChatLog;
