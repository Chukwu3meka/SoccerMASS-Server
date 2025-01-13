import { Schema } from "mongoose";
import { apihubDatabase } from "../database";

const TournamentSchema = new Schema({
  code: { type: String, required: true },
  clubs: { type: Number, required: true },
  tournament: { type: String, required: true },
  ref: { type: String, required: true, unique: true },
});

const TournamentModel = apihubDatabase.model("Tournament", TournamentSchema);

export default TournamentModel;
