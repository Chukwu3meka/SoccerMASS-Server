import validate from "../../../utils/validate";

import { Request, Response } from "express";
import { APIHUB_ENDPOINTS } from "../../../models/apihub.model";
import { HTTP_METHODS } from "../../../utils/constants";
import { apiHubfetcher, catchError, requestHasBody, sleep } from "../../../utils/handlers";

export const endpointTitleExistsFn = async (title: string) => {
  validate({ type: "comment", value: title, sendError: true, label: "Title" });

  const dbResponse = await APIHUB_ENDPOINTS.findOne({ title });
  return !!dbResponse;
};

const composeHandler = async ({ path, method }: { path: string; method: string }) => {
  if (path.startsWith(`${process.env.STABLE_VERSION}/public/`) && HTTP_METHODS.includes(method)) {
    const startTime = Date.now(),
      endpointResponse = await apiHubfetcher(path.replace(`${process.env.STABLE_VERSION}/public`, ""));

    const data = {
      success: true,
      message: "API composed successfully",
      data: { latency: (Date.now() - startTime).toString(), response: endpointResponse },
    };

    return data;
  } else {
    return { success: false, data: null, message: "Invalid Hub endpoint query" };
  }
};

const composeEndpoint = async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["method", "path"] });

    const { method, path } = req.body;

    // 405

    // validate({ value: path, type: "query" });
    // validate({ value: method, type: "query" });

    const composeResponse = await composeHandler({ method, path });
    if (!composeResponse) throw { message: "Unable to compose Endpoint" };

    return res.status(composeResponse.success ? 200 : 406).json(composeResponse);
  } catch (err: any) {
    err.status = 409;
    return catchError({ res, err });
  }
};

export { composeHandler, composeEndpoint as default };
