import { NextFunction, Request, Response } from "express";
import { APIHUB_CATEGORIES, APIHUB_ENDPOINTS } from "../../models/apihub.model";
import { capitalize, catchError } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await APIHUB_ENDPOINTS.aggregate([{ $group: { _id: "$category", count: { $count: {} } } }]);

    const categories = [];

    for (const category of result) {
      const data = await APIHUB_CATEGORIES.findById(category._id, { updated: 0, __v: 0 });
      categories.push(data);
    }

    const data = { success: true, data: categories, message: "Endpoints Successfully retrieved" };

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: true, message: "Categories could not be retrieved", data: [] };
      return res.status(200).json(data);
    }

    return catchError({ res, err });
  }
};
