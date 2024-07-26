import mongoose, { Schema } from "mongoose";

import { ObjectId } from "../shared";

export interface IContext {
  _id?: ObjectId;
  name: string;
  value: string;
}

const schema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
});

const ContextModel = mongoose.model<mongoose.Document & IContext>(
  "Context",
  schema
);

const ArchivedContextModel = mongoose.model<mongoose.Document & IContext>(
  "ArchivedContext",
  schema
);

class Context {
  _id?: ObjectId;
  name: string;
  value: string;

  constructor(obj: IContext) {
    this.validate(obj);
    this._id = obj._id;
    this.name = obj.name?.trim();
    this.value = obj.value;
  }

  async save() {
    if (this._id) {
      await ContextModel.updateOne({ _id: this._id }, this, { upsert: true });
      return;
    }
    const model = await ContextModel.create(this);
    this._id = model.id;
  }

  async delete() {
    if (!this._id) {
      throw new Error("Context id is required");
    }
    await ArchivedContextModel.create(this);
    const model = await ContextModel.findByIdAndDelete(this._id).exec();
    if (!model) {
      throw new Error("Context not found");
    }
  }

  validate(obj: IContext) {
    if (!obj) {
      throw new Error("Context is required");
    }
    if (!obj.name) {
      throw new Error("Context name is required");
    }
    if (!obj.value) {
      throw new Error("Context value is required");
    }
  }

  static async findOne(id: ObjectId) {
    const model = await ContextModel.findOne({ _id: id }).exec();
    if (!model) {
      throw new Error("Context not found");
    }
    return new Context(model);
  }

  static async find() {
    const userContexts = await ContextModel.find({})
      .sort({ _id: -1 })
      .exec()
      .then((models) => models.map((model) => new Context(model)));
    const sharedContexts = [
      new Context({
        name: "dateContext",
        value: new Date().toISOString(),
      }),
    ];
    return [...sharedContexts, ...userContexts];
  }
}
export default Context;
