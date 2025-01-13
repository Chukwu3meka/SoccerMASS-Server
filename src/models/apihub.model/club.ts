import { Schema } from "mongoose";

import { apihubDatabase } from "../database";

const ClubSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  division: { type: String, required: true },
  nickname: { type: String, required: false },
  stadium: { type: String, required: false },
  founded: { type: Number, required: false },
  capacity: { type: Number, required: false },
  location: { type: String, required: false },
  manager: { type: String, required: false },
  rivals: [{ type: String, required: false }],
  squad: [{ type: String, required: false }],
  managers: [
    {
      id: { type: String, required: true },
      fromDate: { type: String, default: new Date().toDateString() },
      toDate: { type: String, default: new Date().toDateString() },
    },
  ],
});

const ClubModel = apihubDatabase.model("Clubs", ClubSchema);

export default ClubModel;
