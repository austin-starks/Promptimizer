import mongoose, { Schema } from "mongoose";

import { IContext } from "../context";
import { ObjectId } from "../shared";
import PromptExample from "./example";
import _ from "lodash";

export enum OpenAiModelEnum {
  fourOmini = "gpt-4o-mini-2024-07-18",
  threePointFiveNew = "gpt-3.5-turbo-0125",
  threePointFive = "gpt-3.5-turbo-1106",
  four = "gpt-4-0125-preview",
  fourO = "gpt-4o-2024-05-13",
}

export enum AnthropicModels {
  claude3Haiku = "claude-3-haiku-20240307",
  claude3Opus = "claude-3-opus-20240229",
  claude35Sonnet = "claude-3-5-sonnet-20240620",
}

export enum OpenSourceImageModels {
  llava = "llava",
  bakllava = "bakllava",
}

// Sorted best to worse (IMO)
export enum OpenSourceModelEnum {
  Phi = "phi",
  Dolphin = "dolphin-mixtral",
  MixtralInstruct = "mixtral:instruct",
  Llama3 = "llama3.1",
  Llama2 = "llama2",
  PhIndCodeLlama = "phind-codellama",
  Openchat = "openchat",
  OpenHermesMistral = "openhermes2.5-mistral",
  DeepSeekLarge = "deepseek-llm:67b-chat-q3_K_S",
  DeepSeek7b = "deepseek-llm:7b-chat",
  Orca = "orca2",
  Codebooga = "codebooga",
  Vicuna13b_16k = "vicuna:13b-16k",
  Zephyr = "zephyr",
  StablelmZephyr = "stablelm-zephyr",
}

export type ModelEnum = OpenAiModelEnum | AnthropicModels | OpenSourceModelEnum;

export interface IAbstractPrompt {
  _id?: ObjectId;
  name: string;
  systemPrompt: string;
  description: string;
  examples: PromptExample[];
  model: string;
  temperature: number;
  forceJSON?: boolean;
}

const promptSchema = new Schema({
  name: { type: String, required: true },
  systemPrompt: { type: String },
  description: { type: String },
  examples: { type: [Object], required: true, default: [] },
  model: { type: String, required: true },
  temperature: { type: Number, required: true },
  forceJSON: { type: Boolean },
});

const PromptModel = mongoose.model<mongoose.Document & IAbstractPrompt>(
  "Prompt",
  promptSchema
);

const ArchivePromptModel = mongoose.model<mongoose.Document & IAbstractPrompt>(
  "ArchivePrompt",
  promptSchema
);

class AbstractPrompt {
  _id?: ObjectId;
  name: string;
  systemPrompt: string;
  description: string;
  examples: PromptExample[];
  model: ModelEnum = OpenAiModelEnum.fourOmini;
  temperature: number = 0;
  forceJSON: boolean;

  constructor(obj: IAbstractPrompt) {
    this.validate(obj);
    this._id = obj._id;
    this.name = obj.name?.trim() || "";
    this.description = obj.description?.trim() || "";
    this.systemPrompt = obj.systemPrompt?.trim() || "";
    this.examples = obj.examples || [];
    this.model = obj.model as ModelEnum;
    this.temperature = obj.temperature;
    this.forceJSON = obj.forceJSON || false;
  }

  async save(): Promise<void> {
    if (this._id) {
      await PromptModel.updateOne({ _id: this._id }, this, { upsert: true });
      return;
    }
    const model = await PromptModel.create(this);
    this._id = model.id;
  }

  validate(obj: IAbstractPrompt) {
    if (!obj) {
      throw new Error("Prompt is required");
    }
    if (!obj.model) {
      throw new Error("Prompt model is required");
    }
    if (_.isNil(obj.temperature)) {
      throw new Error("Prompt temperature is required");
    }
  }

  async delete(): Promise<void> {
    if (!this._id) {
      throw new Error("Prompt not saved");
    }
    await ArchivePromptModel.create({
      ...this,
      _id: undefined,
      promptId: this._id,
    });
    await PromptModel.deleteOne({ _id: this._id });
  }

  public getFullSystemPrompt(
    examples: PromptExample[],
    contexts: IContext[]
  ): string {
    const contextMap = contexts.reduce((acc, context) => {
      if (!context.name) {
        throw new Error("Context name is required");
      }
      acc[context.name] = context.value;
      return acc;
    }, {});
    let fullPrompt = this.systemPrompt?.replace(/\${(.*?)}/g, (_, name) => {
      if (!(name in contextMap)) {
        throw new Error(`Context with the name ${name} does not exist`);
      }
      return contextMap[name];
    });
    const exampleText = AbstractPrompt.getExampleText(examples, this.forceJSON);
    const forceJsonText = this.forceJSON
      ? `IMPORTANT: Forced JSON Mode is enabled. This means the system expects a JSON as the response. 
      Please respond using the schema provided. Note: This is super important. If forceJSON is on, you MUST RESPOND WITH JSON. It has to be in the schema provided. 
      Always generate the content first, then generate the JSON."`
      : "";

    if (this.forceJSON) {
      fullPrompt += `\n\n${forceJsonText}`;
    }
    return [
      exampleText,
      `Description: ${this.description}`,
      `Instructions: ${fullPrompt}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  public static getExampleText(
    examples: PromptExample[],
    forceJSON: boolean
  ): string {
    if (examples.length === 0) {
      return "";
    }
    return (
      `Conversation Example: ` +
      examples
        .map((example) => {
          const conversation = example.conversation;
          return conversation.messages
            .map((message) => {
              let content = message.content || "";
              if (forceJSON) {
                content += `\nForce JSON Mode is enabled. This means that the response must be a JSON with the schema provided (regardless of the example).`;
              }
              if (message.data) {
                content += `\n${JSON.stringify(message.data)}\n`;
              }
              return `${message.sender}:\n${content}`;
            })
            .join("\n");
        })
        .join("\n\n====================================================\n\n")
    );
  }

  static async findOne(id: ObjectId) {
    const model = await PromptModel.findOne({ _id: id }).exec();
    if (!model) {
      throw new Error("Prompt not found");
    }
    return new AbstractPrompt(model);
  }

  static async findOneByName(name: string) {
    const model = await PromptModel.findOne({ name });
    if (!model) {
      throw new Error(`Prompt with name ${name}`);
    }
    return new AbstractPrompt(model);
  }

  static async find() {
    return PromptModel.find({})
      .exec()
      .then((models) => models.map((model) => new AbstractPrompt(model)));
  }
}
export default AbstractPrompt;
