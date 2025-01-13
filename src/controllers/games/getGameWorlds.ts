import { Request, Response } from "express";
import { GAMES_STATISTIC } from "../../models/games.model";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async function getGameWorlds(req: Request, res: Response) {
  try {
    let title = null;

    if (req.params.title) {
      requestHasBody({ body: req.params, required: ["title"], sendError: true });

      const { title: tempTitle } = req.params;
      if (!tempTitle) throw { message: `Invalid Title provided` };

      title = tempTitle;
    }

    const result = await GAMES_STATISTIC.aggregate([
      { $project: { title: 1, ref: 1, _id: 0, unmanaged: { $sum: "$unmanaged.total" }, created: 1, divisions: "$unmanaged" } },
      { $match: title ? { title: { $regex: new RegExp(title as string, "i") }, unmanaged: { $gt: 1 } } : { unmanaged: { $gt: 1 } } },
      { $sample: { size: 20 } },
      { $sort: { unmanaged: -1 } },
      { $project: { title: 1, ref: 1, created: 1, unmanaged: 1, divisions: { total: true, division: true } } },
    ]);

    const data = {
      success: true,
      data: result,
      message: result.length ? "Game Worlds retrieved successfully" : "Failed to retrieve any Game World",
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
