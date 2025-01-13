import { Request, Response } from "express";

import { INFO_ALL_CONTACT_US } from "../../models/info.model";
import { CONTACT_PREFERENCES } from "../../utils/constants";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["category", "comment"] });
    const { category, comment, contact, preference } = req.body;

    if (!CONTACT_PREFERENCES.includes(preference)) throw { message: "Preference is invalid", sendError: true };
    if (!["others", "advertising", "technical", "suggestion", "service"].includes(category))
      throw { message: "Invalid category specified", sendError: true };

    await INFO_ALL_CONTACT_US.create({ category, comment, contact, preference });

    const data = { success: true, message: `Notice sent successfully`, data: null };

    res.status(201).json(data);
  } catch (err: any) {
    err.status = 409;
    return catchError({ res, err });
  }
};
