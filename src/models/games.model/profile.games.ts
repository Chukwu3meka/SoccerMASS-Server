import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const ProfileSchema = new Schema({
  mass: { type: String, required: true },
  club: { type: String, required: true },
  handle: { type: String, required: true },
  division: { type: String, required: true },
  gameWarning: { matchFixing: { type: Number, default: 0 } },
  award: { mom: { type: Number, default: 0 }, moy: { type: Number, default: 0 } },
  clubsManaged: [{ club: { type: String, required: true }, date: { type: Date, default: Date.now } }],
});

const ProfileModel = gamesDatabase.model("Profile", ProfileSchema);

export default ProfileModel;
