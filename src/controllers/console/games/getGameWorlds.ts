import { Request, Response } from "express";
import { catchError, range, requestHasBody } from "../../../utils/handlers";
import { SIZES } from "../../../utils/constants";
import { GAMES_STATISTIC } from "../../../models/games.model";

export default async function getGameWorlds(req: Request, res: Response) {
  try {
    const hasFilterParam = Object.hasOwn(req.query, "filter");
    if (!hasFilterParam) throw { message: "Filter not specified", sendError: true };

    const hasPageParam = Object.hasOwn(req.query, "page");
    if (!hasPageParam) throw { message: "Page not specified", sendError: true };

    const hasSizeParam = Object.hasOwn(req.query, "size");
    if (!hasSizeParam) throw { message: "Size not specified", sendError: true };

    requestHasBody({ body: req.query, required: ["size", "page", "filter"], sendError: true });

    const filter = req.query.filter,
      size = parseInt(req.query.size as any),
      page = parseInt(req.query.page as any);

    if (page < 0) throw { message: "Invalid Page Number specified", sendError: true };
    if (!SIZES.includes(size)) throw { message: "Invalid Size specified", sendError: true };

    // // ? Single fetch with skip and limit returns unexpected result
    // // ? https://www.mongodb.com/community/forums/t/cursor-pagination-using-objectid-timestamp-field-in-mongodb/122170/2

    let result, resultCount;

    switch (filter) {
      case "": {
        resultCount = await GAMES_STATISTIC.aggregate([{ $count: "totalElements" }]);

        result = await GAMES_STATISTIC.aggregate([
          { $sort: { lastUpdated: -1, _id: 1 } },
          { $skip: page * size },
          { $limit: size },
          {
            $project: {
              _id: false,
              id: "$ref",
              title: true,
              totalUnmanaged: true,
              created: true,
            },
          },
        ]);
      }

      default: {
        result = await GAMES_STATISTIC.aggregate([
          { $match: { title: { $regex: new RegExp(filter as string, "i") } } }, // Optional, 'i' for case-insensitive
          { $sort: { lastUpdated: -1, _id: 1 } },
          { $skip: page * size },
          { $limit: size },
          {
            $project: {
              _id: false,
              id: "$_ref",
              title: true,
              totalUnmanaged: true,
              created: true,
            },
          },
        ]);

        resultCount = await GAMES_STATISTIC.aggregate([
          { $match: { title: { $regex: new RegExp(filter as string, "i") } } },
          { $count: "totalElements" },
        ]);
      }
    }

    const data = {
      success: true,
      message: result.length ? "Worlds retrieved successfully" : "Failed to retrieve any Worlds",
      data: { size, page, totalElements: resultCount ? (resultCount[0] ? resultCount[0].totalElements : 0) : 0, content: result },
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
