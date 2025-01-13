import { Schema } from "mongoose";
import { ObjectId } from "mongodb";
import { apihubDatabase } from "../database";

const EndpointSchema = new Schema({
  path: { type: String, required: true },
  title: { type: String, required: true },
  method: { type: String, required: true },
  latency: { type: Number, required: true },
  response: { type: String, required: true },
  reference: { type: String, required: true },
  category: { type: ObjectId, required: true },
  description: { type: String, required: true },
  bookmarks: { type: Number, default: 0, min: 0 },
  lastUpdated: { type: Date, default: new Date() },
  visibility: { type: Boolean, required: true, default: true },
  snippets: [{ title: { type: String, required: true }, code: { type: String, required: true } }],
});

const EndpointModel = apihubDatabase.model("Endpoints", EndpointSchema);

export default EndpointModel;
