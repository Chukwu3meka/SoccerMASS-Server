import { catchError } from "../../utils/handlers";
import { NextFunction, Request, Response } from "express";
import { APIHUB_CATEGORIES, APIHUB_ENDPOINTS } from "../../models/apihub.model";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasLimitParam = Object.hasOwn(req.query, "limit");
    if (!hasLimitParam) throw { message: "Limit not specified", sendError: true };

    const limit = parseInt(req.query.limit as any);
    if (limit < 1) throw { message: "Invalid limit specified", sendError: true };

    const result = await APIHUB_ENDPOINTS.aggregate([{ $group: { _id: "$category", count: { $count: {} } } }, { $limit: limit }]);

    const categories = [];

    for (const category of result) {
      const data = await APIHUB_CATEGORIES.findById(category._id, { _id: false, id: "$_id", category: true, title: true });
      categories.push(data);
    }

    const data = { success: true, data: categories, message: "Endpoints Successfully retrieved" };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
