import express from "express";

// middleware
import passport from "../middleware/passport";
// import timeout from "connect-timeout";
import timeout from "../middleware/timeout";
import routeGuard from "../middleware/routeGuard";

// handlers
import * as personal from "../controllers/accounts";
// import { haltOnTimedout } from "../utils/handlers";

const router = express.Router({ caseSensitive: true, strict: true });

router.route("/email_exists").post(personal.emailExists);
router.route("/handle_exists").post(personal.handleExists);
router.route("/signup").post(personal.signup);
router.route("/verify-email").get(personal.verifyEmail);
// router.route("/signin").post(personal.signin);
// router.route("/signin").post(timeout(3) personal.signin);
router.route("/signin").post(personal.signin);
// router.route("/signin").post(personal.signin);
// router.route("/signin").post(timeout(1, personal.signin as Function));
router.route("/profile").get(routeGuard, personal.profile);
router.route("/signout").get(personal.signout);
router.route("/initiate-password-reset").post(personal.initiatePasswordReset);
router.route("/confirm-password-reset").post(personal.confirmPasswordReset);
router.route("/theme").post(routeGuard, personal.theme);
router.route("/data-deletion").post(routeGuard, personal.dataDeletion);

// router.route("/:club/players").get(club.clubPlayers);

// const passport = require("../middleware/passport").default;

router.route("/twitter").get(passport.authenticate("twitter"));
router.route("/google").get(passport.authenticate("google", { scope: ["email"] }));
router.route("/facebook").get(passport.authenticate("facebook", { scope: ["email"] }));
router.route("/google/callback").get(passport.authenticate("google"), personal.oAuth.googleAuth);
router.route("/twitter/callback").get(passport.authenticate("twitter"), personal.oAuth.twitterAuth);
router.route("/facebook/callback").get(passport.authenticate("facebook"), personal.oAuth.facebookAuth);

export default router;
