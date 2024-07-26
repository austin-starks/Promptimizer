import {
  AnthropicModels,
  OpenAiModelEnum,
  OpenSourceModelEnum,
} from "../models/prompts/abstract";

import AnthropicServiceClient from "./AnthropicServiceClient";
import GenerativeAIServiceClient from "./GenerativeAIServiceClient";
import OpenAIServiceClient from "./OpenAIServiceClient";
import OpenSourceServiceClient from "./OpenSourceServiceClient";

class GenAiFactory {
  static create(
    model: OpenAiModelEnum | OpenSourceModelEnum | AnthropicModels
  ): GenerativeAIServiceClient {
    const openSourceModels = Object.values(OpenSourceModelEnum);
    const openAiModels = Object.values(OpenAiModelEnum);
    const anthropicModels = Object.values(AnthropicModels);
    if (openAiModels.includes(model as OpenAiModelEnum)) {
      return new OpenAIServiceClient();
    } else if (anthropicModels.includes(model as any)) {
      return new AnthropicServiceClient();
    } else if (openSourceModels.includes(model as any)) {
      return new OpenSourceServiceClient();
    } else {
      throw new Error("Invalid model");
    }
  }
}

export default GenAiFactory;
