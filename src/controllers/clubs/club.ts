import { NextFunction, Request, Response } from "express";

import { APIHUB_CLUBS } from "../../models/apihub.model";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestHasBody({ body: req.params, required: ["ref"], sendError: true });
    if (!req.params.ref) throw { sendError: true, message: `Invalid Reference provided` };

    const ref = req.params.ref,
      clubData = await APIHUB_CLUBS.findOne({ ref }, { title: 1, _id: 0 });

    if (!clubData) {
      throw { sendError: true, message: `No club was located with the ref: '${ref}'.` };
    }

    const data = {
      success: true,
      message: `Club data for ${clubData.title} found}`,
      data: clubData,
    };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
