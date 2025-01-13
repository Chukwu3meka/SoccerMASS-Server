import { Request, Response } from "express";
import validate from "../../utils/validate";
import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { catchError, getIdFromSession, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.query, required: ["gear"] });

    const { gear } = req.query;

    // Validate request body before processing request
    validate({ type: "comment", value: gear });

    const id = getIdFromSession(gear as string);
    if (!id) throw { message: "Account", sendError: true };

    const updated = await ACCOUNTS_PROFILE.findOneAndUpdate(
      { _id: id, ["auth.otp.code"]: gear, ["auth.otp.purpose"]: "email verification", ["auth.verification.email"]: null },
      {
        $set: {
          ["auth.verification.email"]: Date.now(),
          ["auth.otp"]: { code: null, purpose: null, time: null },
        },
      }
    );

    if (updated) return res.redirect(302, `${process.env.CLIENT_URL}/accounts/email-verification?status=success`);
  } catch (err: any) {
    res.redirect(302, `${process.env.CLIENT_URL}/accounts/email-verification?status=failed`);

    err.respond = false;
    err.status = 409;
    return catchError({ res, err });
  }
};
