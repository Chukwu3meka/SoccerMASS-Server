import validate from "../../../utils/validate";

import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../../models/apihub.model";
import { catchError, requestHasBody } from "../../../utils/handlers";

const endpointTitleExistsFn = async (title: string) => {
  validate({ type: "comment", value: title, sendError: true, label: "Title" });

  const dbResponse = await APIHUB_ENDPOINTS.findOne({ title });
  return !!dbResponse;
};

const endpointTitleExists = async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["title"] });

    const { title } = req.body;
    const endpointTitleExists = await endpointTitleExistsFn(title);

    const data = {
      success: true,
      data: { exists: endpointTitleExists },
      message: `${title} is ${endpointTitleExists ? "already in use" : "available"}`,
    };
    res.status(200).json(data);
  } catch (err: any) {
    err.status = 409;
    return catchError({ res, err });
  }
};

export { endpointTitleExistsFn, endpointTitleExists as default };
