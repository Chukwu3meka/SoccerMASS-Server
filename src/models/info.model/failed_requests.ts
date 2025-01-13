import { Schema } from "mongoose";

import { infoDatabase } from "../database";

const FailedRequestsSchema = new Schema({
  data: { type: Object, required: true },
  date: { type: String, required: true },
  error: { type: Object, required: true },
  request: { type: Object, required: true },
  time: { type: Date, default: Date.now() },
});

const FailedRequestsModel = infoDatabase.model("Failed_Requests", FailedRequestsSchema);

export default FailedRequestsModel;
