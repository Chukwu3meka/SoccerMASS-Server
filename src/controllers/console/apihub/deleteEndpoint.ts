import validate from "../../../utils/validate";

import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../../models/apihub.model";
import { catchError, requestHasBody } from "../../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["id"], sendError: true });

    const id = req.body.id;
    validate({ value: id, type: "comment", sendError: true, label: "ID" });

    const validId = new ObjectId(id);
    if (!isValidObjectId(validId)) throw { sendError: true, message: "Specified Endpoint ID is invalid" };

    const success = await APIHUB_ENDPOINTS.findByIdAndDelete(id);

    const data = {
      success,
      data: success ? `Endpoint deletion successful` : "Endpoint deletion failed",
      message: success ? `Endpoint has been deleted successfully` : `No response received from DB`,
    };

    return res.status(success ? 200 : 400).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
};
