import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../../models/apihub.model";
import { catchError, requestHasBody } from "../../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.params, required: ["id"], sendError: true });
    if (!req.params.id) throw { message: `Invalid Path provided` };

    const id = new ObjectId(req.params.id);
    if (!isValidObjectId(id)) throw { message: "Selected Endpoint Invalid" };

    const queryResponse = await APIHUB_ENDPOINTS.findById(id, {
      id: "$_id",
      title: true,
      path: true,
      method: true,
      latency: true,
      response: true,
      category: true,
      snippets: true,
      description: true,
    });

    if (!queryResponse) throw { message: "Cannot find data for selected Endpoint", sendError: true };

    // // Strip version and public from path
    // const path = queryResponse.path.replace(`${process.env.STABLE_VERSION}/public/`, "");

    const data = {
      success: true,
      data: queryResponse,
      message: "Endpoint retrieved successfully",
    };

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
};
