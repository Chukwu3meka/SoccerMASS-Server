import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const StatisticSchema = new Schema({
  created: { type: Date, default: Date.now },
  title: { type: String, unique: true, required: true },
  ref: { type: String, unique: true, required: true },
  unmanaged: [
    // unmanaged: { type: Object, of: { type: Number, required: true, default: 0 } },
    { total: { type: Number, required: true, default: 0 }, division: { type: String, required: true } },
  ],
  award: [
    {
      club: { type: String, required: true },
      name: { type: String, required: true },
      speech: { type: String, required: true },
      division: { type: String, required: true },
      award_desc: { type: String, required: true },
    },
  ],
  news: [
    {
      title: String,
      content: String,
      date: { type: Date, default: Date.now },
      image: { type: String, default: "soccermass.png" },
    },
  ],
  transfer: [
    {
      to: { type: String },
      fee: { type: Number },
      from: { type: String },
      player: { type: String },
      date: { type: Date, default: Date.now() },
    },
  ],
  offer: [
    {
      to: { type: String },
      fee: { type: Number },
      from: { type: String },
      player: { type: String },
      date: { type: Date, default: Date.now() },
    },
  ],
});

const StatisticModel = gamesDatabase.model("Statistic", StatisticSchema);

export default StatisticModel;
