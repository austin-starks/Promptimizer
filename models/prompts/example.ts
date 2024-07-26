import { ChatMessage } from "../message";
import { ObjectId } from "../shared";

class PromptExample {
  _id?: ObjectId;
  name?: string;
  conversation: { messages: ChatMessage[] };

  constructor(conversation: { messages: ChatMessage[] }) {
    this.conversation = conversation;
  }
}

export default PromptExample;
