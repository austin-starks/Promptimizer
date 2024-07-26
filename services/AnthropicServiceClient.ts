import AnthropicChatLog, {
  AnthropicChatMessage,
  AnthropicChatRequest,
  AnthropicChatResponse,
} from "../models/aiChatLog/anthropic";
import GenerativeAIServiceClient, {
  MESSAGE_LIMIT,
  transformMessageContent,
  transformSenderToRole,
} from "./GenerativeAIServiceClient";
import { extractJson, removeJson } from "../utils";

import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage } from "../models/message";
import { ObjectId } from "../models/shared";
import OpenAIServiceClient from "./OpenAIServiceClient";
import { OpenAiImageRequest } from "../models/aiChatLog/openai";
import { SendChatMessageRequest } from "../models/aiChatLog/shared";
import { Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

class AnthropicServiceClient extends GenerativeAIServiceClient {
  async embeddings(prompt: string): Promise<number[]> {
    const openAi = new OpenAIServiceClient();
    return await openAi.embeddings(prompt);
  }

  async analyzeImage(request: OpenAiImageRequest): Promise<string> {
    const openAi = new OpenAIServiceClient();
    return await openAi.analyzeImage(request);
  }

  async sendRequest(
    request: SendChatMessageRequest
  ): Promise<{ message: ChatMessage }> {
    const { systemPrompt, model, temperature, messages } = request;
    let systemPromptMessage = { sender: "system", content: systemPrompt };
    console.log("Anthropic request: ", request);
    const response = await this.submitRequest(
      [systemPromptMessage, ...messages],
      model,
      temperature
    );
    console.log("Anthropic response: ", response);
    let json = extractJson(response.content[0]?.text);
    const message: ChatMessage = {
      _id: new Types.ObjectId(),
      sender: "AI Assistant",
      content: removeJson(response.content[0]?.text || ""),
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
    return await this.chat(
      formattedMessages as AnthropicChatMessage[],
      model,
      temperature
    );
  }

  private async chat(
    messages: AnthropicChatMessage[],
    model: string,
    temperature: number
  ): Promise<AnthropicChatResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("API key for Anthropic is missing");
    }
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    const systemMessage =
      messages[0].role === "system" ? messages[0].content : undefined;
    if (systemMessage) {
      messages = messages.slice(1);
    }
    if (messages[0].role !== "user") {
      messages = [{ content: "Hello", role: "user" }, ...messages];
    }

    const enforceAlternation = (
      messages: AnthropicChatMessage[]
    ): AnthropicChatMessage[] => {
      const newMessages: AnthropicChatMessage[] = [];
      let lastRole = "";
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].role === lastRole) {
          newMessages.push({
            content: "Placeholder message",
            role: lastRole === "user" ? "assistant" : "user",
          });
        }
        messages[i].content = messages[i]?.content?.trim() || "";
        newMessages.push(messages[i]);
        lastRole = messages[i].role;
      }
      return newMessages;
    };

    let newMessages = enforceAlternation(messages);

    if (newMessages.length > MESSAGE_LIMIT) {
      newMessages = newMessages.slice(-MESSAGE_LIMIT);
    }

    const data: AnthropicChatRequest = {
      system: systemMessage,
      model: model,
      messages: newMessages,
      temperature: temperature,
      max_tokens: 4096,
    };

    const tryRequest = async (
      retryCount: number,
      delayMs: number,
      timeoutMs: number
    ): Promise<AnthropicChatResponse | undefined> => {
      while (retryCount >= 0) {
        try {
          const timeoutPromise = new Promise<Anthropic.Message>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
          );
          const message = await Promise.race([
            anthropic.messages.create(data as any),
            timeoutPromise,
          ]);
          await AnthropicChatLog.logChat({ ...data }, message, null);
          return message;
        } catch (e) {
          console.log(
            "Error: \n",
            JSON.stringify(e?.response?.data || e.message, null, 2)
          );
          if (e?.response?.data?.error?.code === "context_length_exceeded") {
            const errorMessage =
              "I'm sorry. I have reached the maximum conversation length. I will continue to learn to have longer conversations in the future. To start a new conversation, please refresh the page.";

            await AnthropicChatLog.logChat(data, null, errorMessage);
            data.messages = data.messages.map((message) => {
              message.content = removeJson(message.content);
              return message;
            });
            if (retryCount === 0) {
              throw new Error(errorMessage);
            }
          }
          const errorMessage = e?.error?.message || e.message;
          await AnthropicChatLog.logChat(data, null, errorMessage);
          if (retryCount === 0) {
            console.error(e);
            throw e;
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          retryCount -= 1;
          delayMs *= 2;
        }
      }
    };
    // Maximum 3 retries with an initial delay of 5 seconds and a 10 minute timeout
    return tryRequest(3, 5000, 600000) as Promise<AnthropicChatResponse>;
  }
}

export default AnthropicServiceClient;
