import jwt from "jsonwebtoken";
import pushMail from "../../utils/pushMail";
import validate from "../../utils/validate";

import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { Request, Response, NextFunction } from "express";
import { CLIENT_COOKIES_OPTION } from "../../utils/constants";
import { catchError, hourDiff, calcFutureDate, requestHasBody, generateSession, mitigateProfileBruteForce } from "../../utils/handlers";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    requestHasBody({ body: req.body, required: ["email", "password"] });

    const { email, password: authPassword } = req.body;

    // Validate request body before processing request
    validate({ type: "email", value: email });
    validate({ type: "password", value: authPassword });

    const profile = await ACCOUNTS_PROFILE.findOne({ email });
    if (!profile || !profile.auth || !profile.auth.verification || !profile.auth.failedAttempts || !profile.auth.otp)
      throw { message: "Invalid Email/Password", sendError: true }; // <= verify that account exist, else throw an error

    const {
      id,
      role,
      handle,
      name,
      theme,
      avatar,
      auth: {
        session,
        verification: { email: emailVerified },
        otp: { purpose: otpPurpose, time: otpTime },
      },
    } = profile;

    await mitigateProfileBruteForce({ password: authPassword, profile });

    // Check if account email is verified
    if (!emailVerified) {
      const email_otp = otpPurpose === "email verification",
        expired_otp = hourDiff(otpTime) >= 3;

      if ((email_otp && expired_otp) || !email_otp) {
        const newOTP = {
          code: generateSession(id),
          purpose: "email verification",
          time: calcFutureDate({ context: "hours", interval: 3 }),
        };

        await ACCOUNTS_PROFILE.findByIdAndUpdate(id, { $set: { ["auth.otp"]: newOTP } });

        await pushMail({
          account: "accounts",
          template: "reVerifyEmail",
          address: email,
          subject: "Verify your email to activate Your Wave Research account",
          data: {
            activationLink: `${process.env.BASE_URL}${process.env.STABLE_VERSION}/accounts/verify-email?gear=${newOTP.code}`,
            name,
          },
        });

        throw {
          message: "Kindly check your email inbox/spam for a verification email we just sent",
          sendError: true,
        };
      }

      throw {
        message: `Kindly check your inbox/spam for our latest verification email from Wave Research`,
        sendError: true,
      };
    }

    const SSIDJwtToken = jwt.sign({ session }, process.env.JWT_SECRET as string, { expiresIn: "180 days" }),
      data = { success: true, message: "Email/Password is Valid.", data: { theme, role, name, handle, avatar } };

    await pushMail({
      account: "accounts",
      template: "successfulLogin",
      address: email,
      subject: "Successful Login to Wave Research",
      data: { name },
    });

    res.status(200).cookie("SSID", SSIDJwtToken, CLIENT_COOKIES_OPTION).json(data);
  } catch (err: any) {
    err.status = 401;
    return catchError({ res, err });
  }
};

// domain: req.headers.origin?.replace("http://", ".")?.replace("https://", ".")?.replace(/:\d+/, ""),
// res.status(200).cookie("SSID", SSIDJwtToken, CLIENT_COOKIES_OPTION).cookie("USER", USERJwtToken, CLIENT_COOKIES_OPTION).json(data);
