import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const CalendarSchema = new Schema({
  hg: Number,
  ag: Number,
  week: Number,
  date: String,
  home: String,
  away: String,
  group: String,
  competition: String,
  world: String,
});

const CalendarModel = gamesDatabase.model("Calendar", CalendarSchema);

export default CalendarModel;
