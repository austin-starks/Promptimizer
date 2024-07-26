import mongoose, { Schema } from "mongoose";

import { AiChatTypeEnum } from "./shared";
import Anthropic from "@anthropic-ai/sdk";
import { ObjectId } from "../shared";

export interface AnthropicChatMessage {
  content: string;
  role: "user" | "assistant" | "system";
}

export interface AnthropicChatRequest {
  model: string;
  messages: AnthropicChatMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

export interface AnthropicChatResponse {
  id: string;
  content: Array<Anthropic.TextBlock>;
  usage: Anthropic.Usage;
  role: "assistant";
}

interface AnthropicChatLog {
  type: AiChatTypeEnum;
  request: AnthropicChatRequest;
  response: AnthropicChatResponse;
  createdAt: Date;
  error?: string;
}

const AnthropicChatLogModel = mongoose.model<
  AnthropicChatLog & mongoose.Document
>(
  "AnthropicChatLog",
  new Schema({
    type: { type: String, required: true },
    request: { type: Object, required: true },
    response: { type: Object },
    error: { type: String },
    createdAt: { type: Date, default: Date.now },
  })
);

class AnthropicChatLog {
  static async logChat(
    request: AnthropicChatRequest,
    response: AnthropicChatResponse | null,
    error: string | null
  ) {
    if (error) {
      console.log("Anthropic Chat Error: ", error);
    }
    const log = new AnthropicChatLogModel({
      type: AiChatTypeEnum.Chat,
      request,
      response,
      error,
    });

    await log.save().catch((err) => console.log("Error saving log: ", err));
  }
}

export default AnthropicChatLog;
