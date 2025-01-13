import { styleText } from "util";
import { format } from "date-fns";
import { catchError, formatDate } from "../utils/handlers";
import { Request, Response, NextFunction } from "express";
import { INFO_ALL_REQUEST, INFO_ALL_DAILY_STAT } from "../models/info.model";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { method, url: endpoint } = req,
      localTime = format(new Date(), "pp"),
      displayTime = localTime.split(" ")[0];

    console.log(styleText("italic", `${displayTime} ${method} >> ${endpoint}`));

    if (endpoint.startsWith(process.env.STABLE_VERSION!)) {
      const [, version, domain, ...fullPath] = endpoint.split("/"),
        path = fullPath.join("/");

      if (version && domain && path) {
        await INFO_ALL_REQUEST.create({ version, domain, path, date: formatDate(new Date()) });

        //  ? "Daily Records of Server Stat"

        await INFO_ALL_DAILY_STAT.findOneAndUpdate(
          { date: formatDate(new Date()) },
          {
            $inc: {
              info: domain === "info" ? 1 : 0,
              apihub: domain === "apihub" ? 1 : 0,
              manager: domain === "manager" ? 1 : 0,
              console: domain === "console" ? 1 : 0,
              accounts: domain === "accounts" ? 1 : 0,
            },
          },
          { upsert: true }
        );

        req.body.auth = { id: null, session: null };
        req.body.request = { endpoint, version, domain, path };

        // ? Trim Request body
        const valuesToTrim = ["email", "name", "password", "handle"];
        for (const value of valuesToTrim) {
          if (req.body[value]) {
            if (value === "email") {
              req.body[value] = req.body[value].trim().toLowerCase();
            } else {
              req.body[value] = req.body[value].trim();
            }
          }
        }

        return next();
      }

      throw { message: "invalid endpoint", status: 503, sendError: true };
    }

    throw { message: "Application version error", status: 403, sendError: true };
  } catch (err: any) {
    return catchError({ res, err });
  }
};
