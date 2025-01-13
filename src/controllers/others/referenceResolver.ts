import * as CATEGORIES_MODEL from "../../models/apihub.model";

import { Request, Response } from "express";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async function referenceResolver(req: Request, res: Response) {
  try {
    type Categories = "APIHUB_PLAYERS" | "APIHUB_CLUBS";
    requestHasBody({ body: req.query, required: ["category", "refs"], sendError: true });

    const categories = ["APIHUB_PLAYERS", "APIHUB_CLUBS"],
      maxRef = { APIHUB_PLAYERS: 40, APIHUB_CLUBS: 24, COMPETITIONS: 1 },
      { refs: tempRefs, category: tempCategory } = req.query,
      refs = tempRefs?.toString().replace(/\s/g, "").split(","),
      category = (tempCategory?.toString().toUpperCase() || "") as Categories;

    if (!refs || !category) throw { sendError: true, message: `Invalid  Reference/Category provided` };
    if (!Array.isArray(refs)) throw { sendError: true, message: `References data format is Invalid/broken` };
    if (!categories.includes(category)) throw { sendError: true, message: `Currently unable to map category` };
    if (refs.length > maxRef[category]) throw { sendError: true, message: `Reference resolver limit (${maxRef}) exceeded` };

    const labelName = category === "APIHUB_CLUBS" ? "title" : category === "APIHUB_PLAYERS" ? "name" : "",
      result = await CATEGORIES_MODEL[category].aggregate([
        { $match: { ref: { $in: refs } } },
        { $project: { [labelName]: true, ref: true, _id: false } },
      ]);

    const data = {
      success: true,
      data: result,
      message: result.length ? "Converted successfully" : "Convertion Failed",
    };

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
}
