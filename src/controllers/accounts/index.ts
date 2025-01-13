import signin from "./signin";
import signup from "./signup";
import signout from "./signout";
import * as oAuth from "./oAuth";
import emailExists from "./emailExists";
import handleExists from "./handleExists";
import profile, { getProfileHandler } from "./profile";
import theme from "./theme";
import verifyEmail from "./verifyEmail";
import initiatePasswordReset from "./initiatePasswordReset";
import confirmPasswordReset from "./confirmPasswordReset";
import dataDeletion from "./dataDeletion";

export {
  theme,
  dataDeletion,
  getProfileHandler,
  oAuth,
  signout,
  confirmPasswordReset,
  verifyEmail,
  initiatePasswordReset,
  profile,
  handleExists,
  emailExists,
  signup,
  signin,
};
