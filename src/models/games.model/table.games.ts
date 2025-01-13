import { Schema } from "mongoose";
import { gamesDatabase } from "../database";

const TableSchema = new Schema({
  club: String,
  w: Number,
  d: Number,
  l: Number,
  ga: Number,
  gd: Number,
  gf: Number,
  pts: Number,
  pld: Number,
  group: Number,
  world: String,
  competition: String,
});

const TableModel = gamesDatabase.model("Table", TableSchema);

export default TableModel;
