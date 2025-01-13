import { Schema } from "mongoose";

import { apihubDatabase } from "../database";

const CountrySchema = new Schema({
  country: { type: String, required: true },
  independence: { type: Number, required: true },
  ref: { type: String, required: true, unique: true },
});

const CountryModel = apihubDatabase.model("Countrys", CountrySchema);

export default CountryModel;
