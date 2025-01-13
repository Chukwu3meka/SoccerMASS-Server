import { APIHUB_CLUBS } from "../../models/apihub.model";
import { Request, Response } from "express";
import { GAMES_CLUB } from "../../models/games.model";
// import { FEDERATED_CLUBS } from "../../models/federated";
import { apiHubfetcher, catchError, requestHasBody } from "../../utils/handlers";

export default async (req: Request, res: Response) => {
  try {
    requestHasBody({ body: req.params, required: ["world", "division"], sendError: true });

    const { division, world } = req.params;
    if (!division || !world) throw { sendError: true, message: `Invalid World/Tournament provided` };

    // const result = await FEDERATED_CLUBS.aggregate([
    //   { $match: { division, world } },
    //   { $lookup: { from: "apihub_clubs", localField: "club", foreignField: "ref", as: "apihub" } },
    //   { $project: { _id: false, ref: "$club", budget: true, manager: true, title: { $arrayElemAt: ["$apihub.title", 0] } } },
    // ]);

    const clubsResult = await GAMES_CLUB.aggregate([
      { $match: { division, world } }, //
      { $project: { _id: false, ref: "$club", budget: true, manager: true } },
    ]);

    const refs = clubsResult.map((club) => club.ref);
    const mapperResult = await apiHubfetcher(`/others/reference-resolver?category=clubs&refs=${refs}`);
    if (!mapperResult || !Array.isArray(mapperResult)) throw { sendError: true, message: `Internal Mapping failed, API Hub might be down` };

    const clubs = mapperResult.map(({ ref, title }) => {
      const club = { ...clubsResult.find((club) => club.ref === ref) };
      if (club) return { ...club, title };
    });

    const data = { success: true, data: clubs, message: clubs.length ? "Clubs retrieved successfully" : "Failed to retrieve any Club" };
    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
};
