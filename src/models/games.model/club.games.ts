import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const ClubSchema = new Schema({
  club: { type: String, required: true },
  world: { type: String, required: true },
  division: { type: String, required: true },
  manager: { type: String, default: null },
  budget: { type: Number, required: true },
  history: {
    match: {
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      tie: { type: Number, default: 0 },
      goalFor: { type: Number, default: 0 },
      goalAgainst: { type: Number, default: 0 },
    },
    transfer: {
      priciestArrival: {
        club: { type: String },
        fee: { type: Number },
        player: { type: String },
        date: { type: Date, default: Date.now() },
      },
      cheapestArrival: {
        club: { type: String },
        fee: { type: Number },
        player: { type: String },
        date: { type: Date, default: Date.now() },
      },
      priciestDeparture: {
        club: { type: String },
        fee: { type: Number },
        player: { type: String },
        date: { type: Date, default: Date.now() },
      },
      cheapestDeparture: {
        club: { type: String },
        fee: { type: Number },
        player: { type: String },
        date: { type: Date, default: Date.now() },
      },
    },
    lastFiveMatches: [{ type: String, default: "win", required: true }],
    managers: [{ manager: String, arrival: { type: Date, default: Date.now }, departure: { type: Date } }],
    trophies: {
      cup: { type: Number, default: 0, required: true },
      division_one: { type: Number, default: 0, required: true },
      division_two: { type: Number, default: 0, required: true },
      worldTier1: { type: Number, default: 0, required: true },
      worldTier2: { type: Number, default: 0, required: true },
      divisionShield: { type: Number, default: 0, required: true },
      worldTierShield: { type: Number, default: 0, required: true },
    },
    events: [{ date: { type: Date, default: Date.now }, event: String }],
  },
  reports: [
    {
      title: String,
      content: String,
      date: { type: Date, default: Date.now },
      image: { type: String, default: "/soccermass.webp" },
    },
  ],
  tactics: {
    squad: [{ type: String }],
    pastMatch: { type: Object },
    formation: { type: String, required: true, default: "433A" },
    tackling: { type: String, required: true, default: "Confident" },
    mentality: { type: String, required: true, default: "Balanced" },
    attacking: { type: String, required: true, default: "Middle Axis" },
    tikitaka: { type: String, required: true, default: "Opponent Half" },
  },
  review: {
    mediaCoverage: { type: Number, default: 4, required: true },
    boardConfidence: { type: String, default: "B", required: true },
    fansSatisfaction: { type: Number, default: 70, required: true },
    presidentsMessage: {
      type: String,
      default:
        "The expectaion of the board is quit high, but we expect you to give your best this season, before any decision can be made concerning your future contract with the club",
      required: true,
    },
  },
  shortlist: [],
  nominalAccount: {
    sponsor: { type: Number, default: 0, required: true },
    arrival: { type: Number, default: 0, required: true },
    departure: { type: Number, default: 0, required: true },
  },
  lastMatch: {
    hg: { type: Number, default: 0 },
    ag: { type: Number, default: 0 },
    away: { type: String, default: null },
    home: { type: String, default: null },
    date: { type: Date, default: Date.now },
    homeMatchEvent: Object,
    awayMatchEvent: Object,
    matchStat: {
      clubs: Array,
      goals: Array,
      possesion: Array,
      shots: Array,
      shotsOnTarget: Array,
      passAccuracy: Array,
      attacks: Array,
      tackles: Array,
      freekick: Array,
      corner: Array,
      yellow: Array,
      red: Array,
      saves: Array,
    },

    home11: Array,
    homeSub: Array,
    homeMissing: Array,
    homeFormation: String,

    away11: Array,
    awaySub: Array,
    awayMissing: Array,
    awayFormation: String,
  },
});

const ClubModel = gamesDatabase.model("Club", ClubSchema);

export default ClubModel;
