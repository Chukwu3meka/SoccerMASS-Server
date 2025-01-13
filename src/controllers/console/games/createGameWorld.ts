import validate from "../../../utils/validate";

import { MongoServerError } from "mongodb";
import { Request, Response } from "express";
import { GAMES_CLUB, GAMES_STATISTIC } from "../../../models/games.model";
import { FixturesGenerator } from "../../../utils/fixturesGenerator";
import { apiHubfetcher, catchError, range, requestHasBody, sleep } from "../../../utils/handlers";

export default async (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });

  async function streamResponse(status: "failed" | "success" | "pending", message: string) {
    res.write(`data: ${JSON.stringify({ success: true, data: status, message })}\n\n`);
    if (status === "pending") await sleep(0.1); // ? <= delay next action
  }

  try {
    await streamResponse("pending", "Verifying requirements to create a new Game world");
    requestHasBody({ body: req.body, required: ["title"], sendError: true });

    const [title, todayDate] = [req.body.title, new Date()],
      gwHrs = `${todayDate.getHours()}`.padStart(2, "0"),
      gwDay = `${todayDate.getDate() + 1}`.padStart(2, "0"),
      gwMins = `${todayDate.getMinutes()}`.padStart(2, "0"),
      gwYear = `${todayDate.getFullYear()}`.padStart(4, "0"),
      gwMonth = `${todayDate.getMonth() + 1}`.padStart(2, "0"),
      worldRef = `GW-${gwYear}${gwMonth}${gwDay}-${gwHrs}${gwMins}`;

    validate({ value: title, type: "comment", sendError: true, label: "Title" });
    await streamResponse("success", "Verifying requirements to create a new Game world");

    await streamResponse("pending", `Generating inititial clubs for ${title} Game World`);
    const clubs: { club: string; world: string; division: string; budget: number }[] = [],
      divisons = await apiHubfetcher("/tournament?code=division"),
      unmanaged: { total: number; division: string }[] = [],
      divisionClubs: { [key: string]: string[] } = {};

    for (const { ref: division } of divisons) {
      const divClubs = await apiHubfetcher(`/tournament/clubs/${division}`);
      if (!divClubs) throw { sendError: true, message: "Division CLubs not returned" };

      divisionClubs[division] = divClubs.map((club: any) => club.ref);
      unmanaged.push({ division, total: divisionClubs[division].length });
      clubs.push(...divClubs.map((club: any) => ({ club: club.ref, world: worldRef, division, budget: range(120, 200) })));
    }
    await streamResponse("success", `Generating inititial clubs for ${title} Game World`);

    await streamResponse("pending", "Adding Game World Title/Reference to Database");
    const gameWorld = await GAMES_STATISTIC.create({ title, ref: worldRef, unmanaged })
      .then(async (dbRes) => {
        await streamResponse("success", "Adding Game World Title/Reference to Database");
        return dbRes;
      })
      .catch(async (err: MongoServerError) => {
        if (err.code === 11000) {
          await streamResponse("failed", "Failed to generate Game World as Ref already exists");
          throw { sendError: true, message: "Game World already exists" };
        } else {
          await streamResponse("failed", "Adding Game World Title/Reference to Database");
          throw { sendError: true, message: "Failed to create Game World" };
        }
      });

    if (!gameWorld._id || !gameWorld.ref) {
      await streamResponse("failed", `Database failed to return object for ${title} Game World`);
      throw { sendError: true, message: "Invalid Game World" };
    }

    await streamResponse("pending", `Inserting clubs for ${title} Game World into Games database`);
    await GAMES_CLUB.insertMany(clubs)
      .then(async () => await streamResponse("success", `Inserting clubs for ${title} Game World into Games database`))
      .catch(async () => {
        await streamResponse("failed", `Inserting clubs for ${title} Game World into Games database`);
        throw { sendError: true, message: `Inserting clubs for ${title} Game World into Games database` };
      });

    await streamResponse("pending", `Generating ${title} Game World Fixtures for Cups, Divisions, Shields, World Tiers`);
    await new FixturesGenerator(worldRef, false, res)
      .generateFixtures()
      .then(async () => await streamResponse("success", `Generating ${title} Game World Fixtures for Cups, Divisions, Shields, World Tiers`))
      .catch(async (err) => {
        console.log(err);
        if (err.sendError) await streamResponse("failed", err.message);
        throw { sendError: true, message: `Generating ${title} Game World Fixtures for Cups, Divisions, Shields, World Tiers` };
      });

    await streamResponse("success", `Game world created successfully`);
    return res.end();
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
