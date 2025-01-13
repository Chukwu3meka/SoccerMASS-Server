import { APIHUB_ENDPOINTS } from "../../models/apihub.model";
import { NextFunction, Request, Response } from "express";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestHasBody({ body: req.params, required: ["title"], sendError: true });
    const { title } = req.params;

    if (!title) throw { message: `Invalid Title provided` };

    const result = await APIHUB_ENDPOINTS.findOne(
      { reference: title },
      { _id: 0, id: "$_id", title: 1, description: 1, snippets: 1, response: 1, visibility: 1, path: 1 }
    );
    if (!result) throw { message: "Unable to retrieve Endpoint", sendError: true };
    if (!result.visibility) throw { message: "Endpoint is currently not accessible", sendError: true };

    const data = { success: true, data: result, message: "Endpoint Successfully retrieved" };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
