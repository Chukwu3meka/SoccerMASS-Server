import { APIHUB_CLUBS } from "../../models/apihub.model";
import { catchError } from "../../utils/handlers";
import { NextFunction, Request, Response } from "express";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query;
    if (limit && Number(limit) > 20) throw { message: "Limit must not exceed 20", sendError: true };

    const result = await APIHUB_CLUBS.aggregate([
      { $sample: { size: Number(limit) } },

      {
        $lookup: {
          as: "clubs",
          from: "clubs",
          localField: "club",
          foreignField: "_id",
        },
      },

      {
        $project: {
          _id: 0,
          title: 1,
          stadium: 1,
          manager: 1,
          location: 1,
          reference: "$_id",
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
