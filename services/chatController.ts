import AbstractPrompt, {
  AnthropicModels,
  ModelEnum,
  OpenAiModelEnum,
} from "../models/prompts/abstract";

import { ChatMessage } from "../models/message";
import Context from "../models/context";
import GenAiFactory from "./GenAIFactory";
import _ from "lodash";

const MAX_ATTEMPTS_FORCE_JSON = 5;

class ChatController {
  chat = async (
    abstractPrompt: AbstractPrompt,
    messages: ChatMessage[],
    forceModel: ModelEnum | undefined
  ): Promise<ChatMessage> => {
    let { model, temperature, examples } = abstractPrompt;
    if (forceModel) {
      model = forceModel;
    }
    if (!abstractPrompt.systemPrompt) {
      throw new Error("No system prompt in request");
    }
    if (!model) {
      throw new Error("No model in request");
    }
    if (_.isNil(temperature)) {
      throw new Error("No temperature in request");
    }
    if (!messages) {
      throw new Error("No messages in request");
    }
    const contexts = await Context.find();

    const systemPrompt = abstractPrompt.getFullSystemPrompt(examples, contexts);
    const client = GenAiFactory.create(model);
    if (abstractPrompt.forceJSON) {
      messages.push({
        sender: "AI Assistant",
        content: `Remember, forceJSON mode is enabled.        
          IMPORTANT! After you're almost done, make sure your response contains content and a valid JSON. **It MUST contain JSON.**" 
          
          List out the relevant fields iin the schema, and explain what they mean. Then, generate a valid JSON.
          VERY IMPORTANT: Use the "oneOf" field correctly, and pick one of the indicators in the list. Be very careful. Do not dead-name the object; use the constant types in the schema instead.
          `,
      });
    }
    let response = await client.sendRequest({
      systemPrompt: systemPrompt,
      model: model,
      temperature: temperature,
      messages,
    });
    if (response.message.data || !abstractPrompt.forceJSON) {
      return response.message;
    }
    // The model did not respond with a JSON when forceJSON is enabled. We need to fix it.
    let numAttempts = 0;
    while (!response.message.data && numAttempts < MAX_ATTEMPTS_FORCE_JSON) {
      console.log(
        `Attempt count: ${numAttempts} | The model did not respond with a JSON. Retrying request.\n`,
        JSON.stringify(response.message, null, 2)
      );
      let newResponse = await client.sendRequest({
        systemPrompt: `You are an AI JSON fixer. You are given a message that does not conform to the schema. You were supposed to generate a valid JSON, using the schema provided. Now, your job is fix it. Generate a valid object using the context provided. 
          Explain in (words) in detail what parts of the schema may be missing. Then, generate a valid JSON.`,
        model: model,
        temperature: temperature,
        messages: [
          {
            sender: "AI Assistant",
            content: `Additional context: ${JSON.stringify(messages)}`,
          },
          {
            sender: "User",
            content: JSON.stringify(response.message),
          },
        ],
      });
      if (newResponse.message.data) {
        return newResponse.message;
      }
      numAttempts++;
      messages.push(response.message);
      response = newResponse;
    }
    throw new Error(
      `Could not generate a valid response. Please try re-submitting the request.`
    );
  };
}

export default new ChatController();
