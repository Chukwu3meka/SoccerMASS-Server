import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const matchData = {
  mp: { type: Number, default: 0, required: true },
  cs: { type: Number, default: 0, required: true },
  red: { type: Number, default: 0, required: true },
  goal: { type: Number, default: 0, required: true },
  yellow: { type: Number, default: 0, required: true },
  assist: { type: Number, default: 0, required: true },
  // 5 yellow card, one match suspension
  suspended: { type: Number, default: 0, required: true },
};

const PlayerSchema = new Schema({
  energy: { type: Number, default: 0 }, // - 30 per match
  club: { type: String, required: true },
  world: { type: String, required: true },
  player: { type: String, unique: true, required: true },
  session: { type: Number, required: false, default: 0 }, // played in right position emotion +1, worng position 0 else -1
  emotion: { type: String, required: false, default: "Happy" },

  // session: { type: Number, required: true, default: 0 }, // played in right position emotion +1, worng position 0 else -1
  // emotion: { type: String, required: true, default: "Happy" },
  // emotion: { type: String, required: true },
  // injury: {
  //   daysLeftToRecovery: { type: Number, required: true, default: 0 },
  //   injuryType: { type: String, required: true },
  // },

  // minutesNotPlayed: { type: Number, required: true, default: 0 },
  // minutesPlayedRight: { type: Number, required: true, default: 0 },
  // minutesPlayedWrong: { type: Number, required: true, default: 0 },
  competition: {
    cup: matchData,
    division_one: matchData,
    division_two: matchData,
    worldTier1: matchData,
    worldTier2: matchData,
    divisionShield: matchData,
    worldTierShield: matchData,
  },
  history: {
    mp: { type: Number, default: 0, required: true },
    cs: { type: Number, default: 0, required: true },
    red: { type: Number, default: 0, required: true },
    goal: { type: Number, default: 0, required: true },
    yellow: { type: Number, default: 0, required: true },
    assist: { type: Number, default: 0, required: true },
  },
  injury: {
    daysLeftToRecovery: { type: Number, required: true, default: 0 },
    injuryType: { type: String, default: null },
  },
  transfer: {
    offers: [String],
    listed: { type: Boolean, required: true, default: false },
    locked: { type: Boolean, required: true, default: false },
    forcedListed: { type: Boolean, required: true, default: false },
  },

  /*
  #Emotion  A-F: miserable, depressed, happy, blissful, ecstatic,
  #minutesPlayedRight:  Minutes played in a right role,
  #minutesPlayedWrong:  Minutes played in a wrong role,
  #Yellow/Red in match data represent matches left to complete suspesion
    red card suspension = 2: means player will miss two matches
    ***suspension format***
    League: 3 then 2, then 1 before it becomes 0
    Cup: 1
  #cs: Clean sheet
  */
});

const PlayerModel = gamesDatabase.model("Player", PlayerSchema);

export default PlayerModel;
