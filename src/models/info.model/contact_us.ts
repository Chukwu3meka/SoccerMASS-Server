import { Schema } from "mongoose";

import { infoDatabase } from "../database";

const ContactUsSchema = new Schema({
  date: { type: Date, default: Date.now() },
  contact: { type: String, required: true },
  comment: { type: String, required: true },
  category: { type: String, required: true },
  preference: { type: String, required: true },
});

const DailyStatModel = infoDatabase.model("Contact_Us", ContactUsSchema);

export default DailyStatModel;
