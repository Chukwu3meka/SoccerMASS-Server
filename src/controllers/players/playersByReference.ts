import { NextFunction, Request, Response } from "express";

import { APIHUB_PLAYERS } from "../../models/apihub.model";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async function playersByReference(req: Request, res: Response, next: NextFunction) {
  try {
    requestHasBody({ body: req.query, required: ["refs"], sendError: true });
    if (req.params.refs) throw { message: "Player references not specified", sendError: true };

    const maxRef = 40,
      { refs: tempRefs } = req.query,
      refs = tempRefs?.toString().replace(/\s/g, "").split(",");

    if (!refs) throw { sendError: true, message: `Invalid  Reference provided` };
    if (!Array.isArray(refs)) throw { sendError: true, message: `References data format is Invalid/broken` };
    if (refs.length > maxRef) throw { sendError: true, message: `Player References limit (${maxRef}) exceeded` };

    const result = await APIHUB_PLAYERS.aggregate([
      { $match: { ref: { $in: refs } } },
      { $project: { name: true, ref: true, _id: false, rating: true, roles: true } },
    ]);

    const data = {
      success: true,
      data: result,
      message: "Player data received successfully",
    };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
}
