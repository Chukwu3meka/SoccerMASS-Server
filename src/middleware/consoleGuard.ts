import jwt from "jsonwebtoken";

import { BSON } from "mongodb";
import { codes } from "../utils/codes";
import { ACCOUNTS_PROFILE } from "../models/accounts.model";
import { INFO_ALL_FAILED_REQUESTS } from "../models/info.model";
import { Request, Response, NextFunction } from "express";
import { catchError, formatDate, getIdFromSession } from "../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  const guardResponse = async (message: string) => {
    await INFO_ALL_FAILED_REQUESTS.create({
      data: message,
      date: formatDate(new Date()),
      error: codes["Console Guard error"],
      request: { body: JSON.stringify(req.body), headers: JSON.stringify(req.headers) },
    });

    return res.status(200).json({ success: true, message: new Date().toDateString(), data: codes["Invalid Console Route"] });
  };

  try {
    const cookie = req.cookies.SSID;
    if (!cookie) throw { message: "User not Authenticated" };

    return jwt.verify(cookie, <string>process.env.JWT_SECRET, async (err: any, decoded: any) => {
      if (err) return guardResponse("Invalid Cookie");
      if (!decoded) return guardResponse("Token not available");
      if (!decoded.session) return guardResponse("Broken Session/Token");

      const { session } = decoded;

      if (session) {
        const id = getIdFromSession(session);
        if (!id) return guardResponse("Suspicious token");

        req.body = { ...req.body, auth: { id, session } };

        const profile = await ACCOUNTS_PROFILE.findOne(new BSON.ObjectId(id));

        if (!profile) return guardResponse("Profile not found");
        if (profile?.auth?.session !== session) return guardResponse("Invalid session ID");
        if (!profile || !["moderator"].includes(profile.role)) return guardResponse(codes["Moderator privilege required"]);

        return next(); //Port is important if the url has it
      }
    });
  } catch (err: any) {
    if (err.message) return guardResponse(err.message);

    err.respond = false;
    return catchError({ res, err });
  }
};
