import { Request, Response } from "express";
import pushMail from "../../utils/pushMail";
import validate from "../../utils/validate";
import { emailExistsFn } from "./emailExists";
import { THEMES } from "../../utils/constants";
import { handleExistsFn } from "./handleExists";
import { ACCOUNTS_PROFILE } from "../../models/accounts.model";
import { catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.body, required: ["email", "password", "name", "handle", "theme"] });
    const { theme, email, password, name, handle } = req.body;

    if (!THEMES.includes(theme)) throw { message: "Invalid theme used", sendError: true };

    // Validate request body before processing request
    validate({ type: "email", value: email });
    validate({ type: "handle", value: handle });
    validate({ type: "name", value: name });
    validate({ type: "password", value: password });

    // ? check if email is taken already
    const emailTaken = await emailExistsFn(email);
    if (emailTaken) throw { message: "Email already in use, Kindly use a different email address", sendError: true };

    // ? check if handle is taken already
    const handleTaken = await handleExistsFn(handle);
    if (handleTaken) throw { message: "Handle already in use, Kindly use a different handle", sendError: true };

    return await ACCOUNTS_PROFILE.create({ email, handle, name, "auth.password": password, theme })
      .then(async (dbResponse: any) => {
        const emailPayload = {
          name,
          handle,
          activationLink: `${process.env.BASE_URL}${process.env.STABLE_VERSION}/accounts/verify-email?gear=${dbResponse.auth.otp.code}`,
        };

        await pushMail({ account: "accounts", template: "welcome", address: email, subject: "Welcome to Wave Research", data: emailPayload });

        const data = { success: true, message: "Account created successfully", data: null };

        return res.status(201).json(data);
      })
      .catch(({ message }) => {
        throw { message: message || `Profile creation was unsuccessful`, client: !process.env.NODE_ENV };
      });
  } catch (err: any) {
    return catchError({ res, err });
  }
};
