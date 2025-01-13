import { Schema } from "mongoose";

import { apihubDatabase } from "../database";

const CategoriesSchema = new Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  updated: { type: Date, default: new Date() },
});

const CategoryModel = apihubDatabase.model("Categories", CategoriesSchema);

export default CategoryModel;
