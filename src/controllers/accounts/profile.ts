import validate from "../../utils/validate";

import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";
import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { catchError } from "../../utils/handlers";

export const getProfileHandler = async (tempId: string, session: string) => {
  if (!tempId) throw { message: "Session ID is Invalid" };
  if (!session) throw { message: "Session ID is Invalid" };

  const id = new ObjectId(tempId);
  if (!isValidObjectId(id)) throw { message: "Session ID is invalid" };

  validate({ type: "comment", value: tempId }); // <= Validate request body before processing request
  const profile = await ACCOUNTS_PROFILE.findById(id);

  if (!profile) throw { message: "Can't find associated profile", sendError: true };
  if (profile.auth?.session !== session) throw { message: "Can't find associated profile", sendError: true };
  if (profile.status !== "active") throw { message: "Account not active", sendError: true };

  await ACCOUNTS_PROFILE.findByIdAndUpdate(id, { ["auth.inactivity"]: new Date() });

  const { role, name, handle, theme, avatar } = profile;

  return { role, name, handle, theme, avatar };
};

export default async (req: Request, res: Response) => {
  try {
    const { id: tempId, session } = req.body.auth;

    const data = await getProfileHandler(tempId, session);
    if (!data) throw { message: "Profile not found", sendError: true };

    return res.status(200).json({ success: true, message: `Profile details retrieved successfully`, data });
  } catch (err: any) {
    return catchError({ res, err });
  }
};
