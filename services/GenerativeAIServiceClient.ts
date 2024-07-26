import { ChatMessage } from "../models/message";
import { SendChatMessageRequest } from "../models/aiChatLog/shared";

interface ChatMessageWithRole {
  role: "user" | "assistant" | "system";
  content: string;
  data?: any;
}

export const transformMessageContent = (
  message: ChatMessageWithRole
): ChatMessageWithRole => {
  if (!message.content) {
    message.content = "";
  }
  if (message.data) {
    message.content = `
${message.content}
\`\`\`
${JSON.stringify(message.data)}
\`\`\``.trim();
  }
  delete message.data;
  message.content = message.content
    .replace(/ {2,}/g, " ")
    .replace(/\t+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  return message;
};

export const transformSenderToRole = (
  message: ChatMessage
): ChatMessageWithRole => {
  const role =
    message.sender === "AI Assistant" || message.sender === "assistant"
      ? "assistant"
      : message.sender === "system"
      ? "system"
      : "user";
  return { role, content: message?.content || "" };
};

export const MESSAGE_LIMIT = 100;

abstract class GenerativeAIServiceClient {
  abstract embeddings(prompt: string): Promise<number[]>;

  abstract sendRequest(
    request: SendChatMessageRequest
  ): Promise<{ message: ChatMessage }>;
}

export default GenerativeAIServiceClient;
