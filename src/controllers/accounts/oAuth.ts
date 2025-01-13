import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

import pushMail from "../../utils/pushMail";
import validator from "../../utils/validate";
import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { CLIENT_COOKIES_OPTION } from "../../utils/constants";
import { capitalize, catchError, hourDiff, generateSession, calcFutureDate, obfuscate, mitigateProfileBruteForce } from "../../utils/handlers";

import { PushMail } from "../../interface/pushMail-handlers-interface";

const oAuthFunc = async (req: Request, res: Response) => {
  const auth = req.body.auth;

  try {
    const email = <PushMail["address"]>req.user;
    validator({ type: "email", value: email, label: "Email" });

    const profile = await ACCOUNTS_PROFILE.findOne({ email });
    if (!profile || !profile.auth || !profile.auth.verification || !profile.auth.failedAttempts || !profile.auth.otp)
      throw { message: "Email not associated with any account", sendError: true }; // <= verify that account exist, else throw an error

    const {
      id,
      handle,
      name,
      status: accountStatus,
      auth: {
        locked,
        session,
        verification: { email: emailVerified },
        otp: { purpose: otpPurpose, time: otpTime },
      },
    } = profile;

    await mitigateProfileBruteForce({ password: false, profile });

    // Check if account email is verified
    if (!emailVerified) {
      const hoursElapsed = hourDiff(otpTime);

      if (otpPurpose !== "email verification" || hoursElapsed >= 1) {
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
          message:
            "Verify your email to activate Your Wave Research account, kindly check your email inbox/spam for the most recent verification email from us",
          sendError: true,
        };
      }

      throw {
        message: `Kindly check your inbox/spam for our latest verification email that was sent ${
          hoursElapsed + 3 ? "few hours" : "less than an hour"
        } ago`,
        sendError: true,
      };
    }

    const SSIDJwtToken = jwt.sign({ session }, process.env.JWT_SECRET as string, { expiresIn: "180 days" });

    await pushMail({
      data: { name },
      address: email,
      account: "accounts",
      template: "successfulLogin",
      subject: `Successful Login to Wave Research via ${capitalize(auth)}`,
    });

    return res.status(200).cookie("SSID", SSIDJwtToken, CLIENT_COOKIES_OPTION).redirect(302, `${process.env.CLIENT_URL}?auth=${auth}`);
  } catch (err: any) {
    const message = err.sendError ? err.message : "We encountered an oAuth error. Kindly try again later or contact support if issue persists";
    return res.redirect(`${process.env.CLIENT_URL}/accounts/signin/?${auth}=${obfuscate(`${new Date()}`)}&response=${obfuscate(message)}`);
  }
};

export const facebookAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.auth = "facebook";
    await oAuthFunc(req, res);
  } catch (err: any) {
    return catchError({ res, err });
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.auth = "google";
    await oAuthFunc(req, res);
  } catch (err: any) {
    return catchError({ res, err });
  }
};

export const twitterAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body.auth = "twitter";
    await oAuthFunc(req, res);
  } catch (err: any) {
    return catchError({ res, err });
  }
};
