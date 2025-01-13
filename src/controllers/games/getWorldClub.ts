import { Request, Response } from "express";
import { GAMES_CLUB, GAMES_PLAYER } from "../../models/games.model";
import { apiHubfetcher, catchError, preciseRound, requestHasBody } from "../../utils/handlers";

export default async function getWorldClub(req: Request, res: Response) {
  try {
    requestHasBody({ body: req.params, required: ["world", "club"], sendError: true });

    const { club, world } = req.params;
    if (!club || !world) throw { sendError: true, message: `Invalid World/Tournament provided` };

    // await APIHUB_PLAYERS.deleteMany({ ref: { $in: temp.map((x) => x.ref) } });
    // await GAMES_PLAYER.deleteMany({ ref: { $in: temp.map((x) => x.ref) } });
    // await APIHUB_PLAYERS.insertMany(temp.map(({ ref, club, rating, roles, name }) => ({ ref, club, rating, roles, name })));
    // await GAMES_PLAYER.insertMany(temp.map(({ ref, club, rating, roles, name }) => ({ club, player: ref, rating, roles, name, world })));

    const playersResult = await GAMES_PLAYER.aggregate([
      { $match: { world, club } }, //
      { $project: { _id: false, ref: "$player", rating: true, roles: true } },
    ]);

    const refs = playersResult.map((club) => club.ref);
    const players = await apiHubfetcher(`/ref/players?refs=[${refs}]`);
    if (!players || !Array.isArray(players)) throw { sendError: true, message: `Internal Mapping failed, API Hub might be down` };

    const gamesClubData = await GAMES_CLUB.aggregate([
      { $match: { world, club } },
      { $limit: 1 }, // limit search to one record
      { $project: { _id: false, manager: true } },
    ]);

    if (!gamesClubData.length) throw { sendError: true, message: `Failed to fetch club data from Games Database` };

    const apihubClubData = await apiHubfetcher(`/clubs/${club}`);
    if (!apihubClubData) throw { sendError: true, message: `Club's data not returned from API Hub` };

    const totalRating = players.reduce((total, curr) => (total += curr.rating), 0),
      averageRating = totalRating / players.length,
      maximumRating = (players.length * 100) / players.length,
      clubRating = preciseRound((averageRating / maximumRating) * 5, 2);

    const data = {
      success: true,
      message: players.length ? "Players retrieved successfully" : "Failed to retrieve any Player",
      data: { players, club: { rating: clubRating, ...apihubClubData, ...gamesClubData[0] } },
    };

    return res.status(200).json(data);
  } catch (err: any) {
    if (err.sendError && err.type === "validate") {
      const data = { success: false, message: err.description && err.description.message, data: null };
      return res.status(400).json(data);
    }

    return catchError({ res, err });
  }
}
