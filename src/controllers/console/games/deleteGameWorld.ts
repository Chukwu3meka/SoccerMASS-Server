import validate from "../../../utils/validate";

import { MongoServerError } from "mongodb";
import { Request, Response } from "express";
import { GAMES_CALENDAR, GAMES_CLUB, GAMES_STATISTIC, GAMES_TABLE } from "../../../models/games.model";
import { FixturesGenerator } from "../../../utils/fixturesGenerator";
import { ObjectEntries, apiHubfetcher, catchError, requestHasBody, sleep, textToId } from "../../../utils/handlers";

export default async (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });

  async function streamResponse(status: "failed" | "success" | "pending", message: string) {
    res.write(`data: ${JSON.stringify({ success: true, data: status, message })}\n\n`);
    if (status === "pending") await sleep(0.1); // ? <= delay next action
  }

  try {
    // !!!!!!!!!!!!!!!!!!
    await GAMES_STATISTIC.deleteMany();
    await GAMES_CLUB.deleteMany();
    await GAMES_TABLE.deleteMany();
    await GAMES_CALENDAR.deleteMany();
    // !!!!!!!!!!!!!!!!!!
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      await streamResponse("pending", err.description && err.description.message);
      return res.end();
    } else if (err.sendError && err.message) {
      await streamResponse("failed", err.message);
      return res.end();
    } else {
      return catchError({ res, err: err?.message ? { ...err, type: "stream" } : err });
    }
  }
};
