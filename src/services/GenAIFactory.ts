import { AnthropicModels, OpenAiModelEnum } from "../models/prompts/abstract";

import AnthropicServiceClient from "./AnthropicServiceClient";
import GenerativeAIServiceClient from "./GenerativeAIServiceClient";
import OpenAIServiceClient from "./OpenAIServiceClient";

class GenAiFactory {
  static create(
    model: OpenAiModelEnum | AnthropicModels
  ): GenerativeAIServiceClient {
    const openAiModels = Object.values(OpenAiModelEnum);
    const anthropicModels = Object.values(AnthropicModels);
    if (openAiModels.includes(model as OpenAiModelEnum)) {
      return new OpenAIServiceClient();
    } else if (anthropicModels.includes(model as any)) {
      return new AnthropicServiceClient();
    } else {
      throw new Error("Invalid model");
    }
  }
}

export default GenAiFactory;
