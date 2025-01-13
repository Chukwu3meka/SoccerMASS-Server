import "dotenv/config";

import { styleText } from "util";
import { ENV_VARIABLES } from "./utils/constants";
import { capitalize, formatDate } from "./utils/handlers";
import { INFO_ALL_FAILED_REQUESTS } from "./models/info.model";

import express from "express";
import bodyParser from "body-parser";
import routeHandlers from "./routes";
import logger from "./middleware/logger";
import header from "./middleware/header";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import passport from "./middleware/passport";
import twitterPassport from "./middleware/twitterPassport";

const initServer = async () => {
  try {
    for (const label of ENV_VARIABLES) {
      // console.error(`${label} Env. Variable has no value`);
      if (!process.env[label]) throw new Error(`${label} Env. Variable has no value`);
    }

    const APP_ENV = process.env.NODE_ENV ? capitalize(process.env.NODE_ENV) : "",
      [BASE_URL, STABLE_VERSION] = [process.env.BASE_URL!, process.env.STABLE_VERSION],
      [NODE_ENV, SECRET_KEY, PORT] = [APP_ENV === "Test" ? "Preview" : APP_ENV, process.env.SECRET, process.env.PORT || 5000];

    const APP = express();
    APP.use(cookieParser(SECRET_KEY));
    APP.use(bodyParser.json({ limit: "1mb" }));
    APP.use(bodyParser.urlencoded({ extended: true }));
    APP.use(cookieSession({ secret: SECRET_KEY }));
    APP.use(twitterPassport); // <= fix error with twitter passport
    APP.use(passport.initialize()); // <=
    APP.use(passport.session()); // <=
    APP.use(header); // <= Add no index for search engines
    APP.use(logger); // <= Application logger

    routeHandlers(APP);

    APP.listen(PORT, () => {
      const url = BASE_URL + STABLE_VERSION,
        env = NODE_ENV === "Production" ? "Prod" : NODE_ENV === "Development" ? "Dev" : "Test";

      console.info(styleText("cyan", env + " Server is ready at"), styleText("green", url));

      return;
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "Development") {
      console.error(`Wave Research:`, (error.message as string) || error);
    } else {
      await INFO_ALL_FAILED_REQUESTS.create({
        error: error || null,
        date: formatDate(new Date()),
        request: process.env.NODE_ENV || "undefined",
        data: (error.message as string) || "not available",
      });
    }
  }
};

initServer();
