import { Schema } from "mongoose";

import { apihubDatabase } from "../database";

const PlayerSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  club: { type: String, required: true },
  country: { type: String, required: false },
  name: { type: String, required: true },
  dob: { type: Date, required: false },
  rating: { type: Number, required: true },
  value: { type: Number, required: false },
  roles: [{ type: String }],
});

const PlayerModel = apihubDatabase.model("Players", PlayerSchema);

export default PlayerModel;
