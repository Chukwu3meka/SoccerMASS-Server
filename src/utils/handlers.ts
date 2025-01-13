import pushMail from "./pushMail";

import { v4 as uuid } from "uuid";
import { ObjectId } from "mongoose";
import { ACCOUNTS_PROFILE } from "../models/accounts.model";
import { INFO_ALL_FAILED_REQUESTS } from "../models/info.model";
import { CatchError } from "../interface/utils-handlers-interface";
import { CalcFutureDate, MitigateProfileBruteForce, RequestHasBody } from "../interface/utils/handlers.interface";
import { styleText } from "util";

export const catchError = async ({ res, req, err: initError }: CatchError) => {
  const { request = null, ...data } = res.req.body,
    { sendError = false, status = 400, message = null, respond = true, type = "json" } = initError || [];

  if (message !== "invalid endpoint") {
    // handle api calls rejected by requests middleware
    await INFO_ALL_FAILED_REQUESTS.create({ error: initError, data, request: request || "undefined", date: formatDate(new Date()) });
  }

  if (<string>process.env.NODE_ENV === "development") {
    console.warn(request ? `${request.endpoint} <<<>>> ${JSON.stringify(message).replaceAll('"', "")}` : `${res.req.url} <<<>>> Invalid route`);
  }

  if (respond) {
    const resData = { success: false, message: sendError ? message : "Unable to process request", data: null };

    if (type === "stream") {
      res.write(`data: ${JSON.stringify(resData)}\n\n`);
      res.end();
    } else {
      res.status(status).json(resData);
    }
  }
};

export const sleep = async (seconds: number) => {
  const duration = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, duration));
};

export const requestHasBody = ({ body, required, sendError = false }: RequestHasBody) => {
  // console.log({ body, required });

  for (const x of required) {
    if (body[x] === undefined) throw { message: `${x} is not defined`, sendError };
  }

  // const validate = require("./validator").validate;
  // const newBody = {};

  // // validate all required param
  // for (const key of required) {
  //   if (
  //     validate(
  //       key === "password"
  //         ? "password"
  //         : key === "handle"
  //         ? "handle"
  //         : key === "email"
  //         ? "email"
  //         : "date" === key
  //         ? "date"
  //         : ["serverStamp", "fee"].includes(key)
  //         ? "number"
  //         : ["list", "target"].includes(key)
  //         ? "boolean"
  //         : ["squad", "roles"].includes(key)
  //         ? "textArray"
  //         : ["age", "value", "rating"].includes(key)
  //         ? "numberArray"
  //         : "text",
  //       body[key]
  //     ) === undefined
  //   ) {
  //     throw `${key} parameter not validataed`;
  //   }

  //   newBody[key] = ["serverStamp", "fee"].includes(key) ? Number(body[key]) : body[key];
  // }

  // return { ...newBody };
};

export const calcFutureDate = ({ interval, context }: CalcFutureDate): Date => {
  const currentTime = new Date();

  switch (context) {
    case "days":
      const futureDate = new Date();
      futureDate.setDate(currentTime.getDate() + interval);
      return futureDate;
    case "hours":
      return new Date(currentTime.getTime() + interval * 60 * 60 * 1000);
    default:
      return new Date();
  }
};

// difference in hours between date
export const hourDiff = (date1: Date, date2?: Date) => {
  let diff;

  if (date1 && date2) {
    diff = Math.round((new Date(date1).valueOf() - new Date(date2).valueOf()) / (1000 * 60 * 60));
  } else {
    diff = Math.round((new Date().valueOf() - new Date(date1).valueOf()) / (1000 * 60 * 60));
  }

  return diff;
};

// difference in hours between date
export const obfuscate = (phrase: string) => {
  let r = "";
  for (let i of phrase.split("").keys()) {
    let valh = (phrase.charCodeAt(i) ^ 0x7f).toString(16);
    if (valh.length == 1) valh = "0" + valh;
    r += valh;
  }
  return r;
};

export const range = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateSession = (id: ObjectId) => {
  const randOne = Date.now(),
    randDate = Date.now() + Date.now(),
    randTwo = String(range(111111, 999999)),
    randStart = String(range(1111111, 9999999)),
    randStop = String(range(1111111111, 9999999999)),
    randUuid = `${uuid()}-${uuid()}-${uuid()}-${uuid()}-${uuid()}`;

  return `${randOne}-${uuid()}-${randUuid}-${randTwo}-${id}-${randStart}-${randDate}-${randStop}`;
};

export const getIdFromSession = (session: string) => {
  const subSessions = session.split("-");
  const id = subSessions[subSessions.length - 4];

  return id;
};

export const capitalize = (phrase: string) => {
  if (!phrase) return null;

  return phrase
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

export const mitigateProfileBruteForce = async ({ profile, password: authPassword }: MitigateProfileBruteForce) => {
  const {
    id,
    name,
    email,
    status: accountStatus,
    auth: {
      locked,
      password,
      failedAttempts: { counter, lastAttempt },
    },
  } = profile;

  if (accountStatus !== "active") {
    throw {
      message: "Reach out to us for assistance in reactivating your account or to inquire about the cause of deactivation",
      sendError: true,
    };
  }

  if (authPassword !== false) {
    const matchPassword = await ACCOUNTS_PROFILE.comparePassword(authPassword, password);

    if (!matchPassword) {
      const failedAttempts = counter + 1,
        hoursElapsed = hourDiff(lastAttempt);

      // Notify user on Login Attempt
      if ([5, 6].includes(failedAttempts))
        await pushMail({
          account: "accounts",
          template: "failedLogin",
          address: email,
          subject: "Failed Login Attempt - Wave Research",
          data: { name },
        });

      if (!(failedAttempts % 3))
        await pushMail({
          account: "accounts",
          template: "lockNotice",
          address: email,
          subject: "Account Lock Notice - Wave Research",
          data: { name },
        });

      // Increment record on Database
      if (failedAttempts >= 7 && hoursElapsed < 1) {
        await ACCOUNTS_PROFILE.findByIdAndUpdate(id, {
          $inc: { ["auth.failedAttempts.counter"]: 1 },
          $set: { ["auth.locked"]: new Date(), ["auth.failedAttempts.lastAttempt"]: new Date() },
        });
      } else {
        await ACCOUNTS_PROFILE.findByIdAndUpdate(id, {
          $inc: { ["auth.failedAttempts.counter"]: 1 },
          $set: { ["auth.failedAttempts.lastAttempt"]: new Date() },
        });
      }

      throw { message: "Invalid Email/Password", sendError: true };
    }
  }

  // update acount lock/security settings
  if (locked) {
    const accLocked = hourDiff(locked) <= 1; // ? <= check if account has been locked for 1 hours
    if (accLocked) throw { message: "Account is temporarily locked, Please try again later", sendError: true };

    await ACCOUNTS_PROFILE.findByIdAndUpdate(id, {
      $inc: { ["auth.lastLogin.counter"]: 1 },
      $set: {
        ["auth.locked"]: null,
        ["auth.failedAttempts.counter"]: 0,
        ["auth.failedAttempts.lastAttempt"]: null,
        ["auth.lastLogin.lastAttempt"]: Date.now(),
      },
    });
  }
};

// export const haltOnTimedout = (req: Request, res: Response, next: NextFunction) => {
//   if (!req.timedout) next();
// };

// res.writeHead(302, { Location: process.env.BASE_URL }).end();
// export const redirectToWeb = (req: Request, res: Response) => res.redirect(302, `${process.env.BASE_URL}`);

// function to generate the date for n  days from now:

export const verifyImageFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();
      image.src = event.target?.result as string;

      image.onload = () => {
        resolve(true); // File is a valid image
      };

      image.onerror = () => {
        resolve(false); // File is not an image
      };
    };

    reader.readAsDataURL(file);
  });
};

export const verifyFileAsPDF = (file: File): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const uint = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 4);
      let header = "";

      for (let i = 0; i < uint.length; i++) {
        header += uint[i].toString(16);
      }

      // Check if the file's header matches the PDF magic number "25504446" (hex for "%PDF")
      const isPDF = header === "25504446";
      resolve(isPDF);
    };

    reader.readAsArrayBuffer(file);
  });
};

export const textToId = (phrase: string) => {
  if (!phrase) throw { message: "Unable to transform string" };

  // return phrase
  //   .split(" ")
  //   .map((word) => word.toLowerCase())
  //   .join("-");

  return phrase.replace(/\s+/g, "-").toLowerCase();
};

export const formatDate = (date: string | Date) => {
  const d = new Date(date),
    year = d.getFullYear(),
    day = d.getDate().toString().padStart(2, "0"),
    month = (d.getMonth() + 1).toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function shuffleArray(tempArray: any[]) {
  const array = [...tempArray];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];
export function ObjectEntries<T extends object>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}

export function createSubarrays(arr: any[], subArraySize: number) {
  const subarrays = [];
  for (let i = 0; i < arr.length; i += subArraySize) {
    subarrays.push(arr.slice(i, i + subArraySize));
  }
  return subarrays;
}

export async function apiHubfetcher(subPath: string) {
  try {
    console.log(styleText("bgGrey", "API Hub internal access"));

    if (!subPath) return null;
    const basePath = `${process.env.BASE_URL}${process.env.STABLE_VERSION}/public`;

    return await fetch(basePath + subPath, {
      /* credentials: "include", tells browser will include credentials in the request,
The server must respond with the appropriate CORS headers, including:
Access-Control-Allow-Origin and Access-Control-Allow-Credentials,
to allow the response to be received by the client. */
      // credentials: "include",
      credentials: "same-origin",
      /* mode: "cors", This involves sending a preflight OPTIONS request to the server to check whether the server allows the requested access,
and then sending the actual request if the server responds with the appropriate CORS headers. */
      mode: "same-origin",
      method: "GET",
      cache: "no-store",

      headers: {
        "Content-Type": "application/json",
        "x-waverd-host": "Wave-Research-2018",
        "x-waverd-key": "Wave-Research-APIHUB-2023",
      },
    }).then(async (res) => {
      if (!res.ok) throw { base: "!res.ok", message: res };

      return res
        .json()
        .then(async (res) => {
          return res.data;
        })
        .catch(async (err) => {
          throw { base: ".catch", message: err };
        });
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") console.log(styleText("red", "API Hub internal access failed"));

    return null;
  }
}

export function preciseRound(value: string | number, exp: number) {
  value = Number(value);

  /**
   * Decimal adjustment of a number.
   *
   * @param   {String}    type    The type of adjustment.
   * @param   {Number}    value   The number.
   * @param   {Integer}   exp     The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number}            The adjusted value.
   */
  function decimalAdjust(type: "round", value: number, exp: number) {
    // If the exp is undefined or zero...
    if (typeof exp === "undefined" || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === "number" && exp % 1 === 0)) {
      return NaN;
    }

    // Shift forward
    let stringValue = value.toString().split("e"); // convert to string
    let valueNumber: number = Math[type](+(stringValue[0] + "e" + (stringValue[1] ? +stringValue[1] - exp : -exp)));

    // Shift backward
    stringValue = valueNumber.toString().split("e");
    return +(stringValue[0] + "e" + (stringValue[1] ? +stringValue[1] + exp : exp));
  }

  // reverse positive to negative or negative to positive
  const revExp = exp - exp * 2;

  // You can use floor, ceil or round
  return decimalAdjust("round", value, revExp);
}
