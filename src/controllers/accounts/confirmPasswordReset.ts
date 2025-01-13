import { Request, Response } from "express";

import pushMail from "../../utils/pushMail";
import validate from "../../utils/validate";
import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { catchError, hourDiff, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["email", "password", "gear"] });
    const { email, password, gear } = req.body;

    // Validate request body before processing request
    validate({ type: "email", value: email });
    validate({ type: "comment", value: gear });
    validate({ type: "password", value: password });

    const profile = await ACCOUNTS_PROFILE.findOne({ email, ["auth.otp.code"]: gear });
    if (!profile || !profile.auth || !profile.auth.otp) throw { message: "Invalid password reset link", sendError: true }; // <= verify that account exist, else throw an error

    if (profile.auth.otp.purpose === "password reset") {
      const otpSentRecently = hourDiff(profile.auth.otp.time) > 3;
      if (otpSentRecently) throw { message: "Password reset link has expired", sendError: true };
    }

    const hashedPassword = await ACCOUNTS_PROFILE.hashPassword(password);

    await ACCOUNTS_PROFILE.findByIdAndUpdate(profile.id, {
      $set: { ["auth.password"]: hashedPassword, ["auth.otp"]: { code: null, purpose: null, time: null } },
    }).then(async () => {
      await pushMail({
        address: email,
        account: "accounts",
        template: "confirmPasswordReset",
        data: { name: profile.name },
        subject: "Wave Research Password Reset Confirmation",
      });
    });

    const data = { success: true, message: "Password reset successful", data: null }; // Always return true whether successful or failed
    return res.status(201).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
