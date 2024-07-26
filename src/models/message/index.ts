import { ObjectId } from "../shared";

export interface ChatMessage {
  _id?: ObjectId;
  sender: string;
  content: string;
  data?: any;
}
