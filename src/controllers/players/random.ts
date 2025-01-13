import { NextFunction, Request, Response } from "express";

import { APIHUB_PLAYERS } from "../../models/apihub.model";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestHasBody({ body: req.query, required: ["limit"], sendError: true });

    const { limit = 20 } = req.query;
    if (limit && Number(limit) > 20) throw { message: "Limit must not exceed 20", sendError: true };

    const result = await APIHUB_PLAYERS.aggregate([
      { $sample: { size: Number(limit) } },

      {
        $lookup: {
          from: "clubs",
          localField: "club",
          foreignField: "_id",
          as: "clubs",
        },
      },

      {
        $project: {
          _id: 0,
          name: 1,
          ref: "$_id",
          country: 1,
          club: { $arrayElemAt: ["$clubs.title", 0] },
          dob: { $dateToString: { format: "%Y-%m-%d", date: "$dob" } },
        },
      },

      { $limit: Number(limit) },
    ]);

    if (!result) throw { message: "Unable to retrieve Players", sendError: true };

    const data = { success: true, data: result, message: "Players Successfully retrieved" };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
