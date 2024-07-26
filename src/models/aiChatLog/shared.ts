import { ChatMessage } from "../message";
import { ObjectId } from "../shared";

export interface SendChatMessageRequest {
  systemPrompt: string;
  model: string;
  temperature: number;
  messages: ChatMessage[];
}

export enum AiChatTypeEnum {
  Image = "image",
  Embeddings = "embeddings",
  Chat = "chat",
}
