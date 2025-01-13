import { APIHUB_CLUBS } from "../../models/apihub.model";
import { NextFunction, Request, Response } from "express";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestHasBody({ body: req.params, required: ["division"] });
    const { division } = req.params;

    return await APIHUB_CLUBS.find({ division })
      .then((clubs) => {
        if (!clubs.length) throw { message: `No club was found in this division.` };

        const data = { success: true, message: `Clubs retrieved successfully`, data: clubs };
        return res.status(200).json(data);
      })
      .catch(() => {
        throw { message: `Failed tr retrieve clubs in this division.` };
      });
  } catch (err: any) {
    return catchError({ res, err });
  }
};
