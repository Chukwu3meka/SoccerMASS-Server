import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { getProfileHandler } from "../accounts";
import { catchError } from "../../utils/handlers";
import { GAMES_PROFILE } from "../../models/games.model";

export default async (req: Request, res: Response) => {
  try {
    const { id: tempId, session } = req.body.auth;

    const profile = getProfileHandler(tempId, session);
    if (!profile) throw { message: "Profile not found", sendError: true };

    const id = new ObjectId(tempId),
      gameProfile = await GAMES_PROFILE.findByIdAndUpdate(id);

    if (!gameProfile) throw { message: "Games Profile not found", sendError: true };
    const data = { success: true, message: `Profile details retrieved successfully`, data: gameProfile };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
