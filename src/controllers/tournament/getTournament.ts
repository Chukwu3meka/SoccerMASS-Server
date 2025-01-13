import { APIHUB_TOURNAMENTS } from "../../models/apihub.model";
import { catchError } from "../../utils/handlers";
import { NextFunction, Request, Response } from "express";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    // await APIHUB_TOURNAMENTS.deleteMany();
    // await APIHUB_TOURNAMENTS.insertMany(b);

    const code = req.query.code;
    if (!code) throw { message: "Tournament Code not found", sendError: true };

    const result = await APIHUB_TOURNAMENTS.find({ code });

    if (!result.length) throw { message: "Unable to retrieve Tournaments", sendError: true };
    const data = { success: true, data: result, message: "Tournamnets successfully retrieved" };

    return res.status(200).json(data);
  } catch (err: any) {
    return catchError({ res, err });
  }
};

// const b = [
//   { ref: "tour001_one", code: "division", clubs: 20, tournament: "Premier League" },
//   { ref: "tour001_two", code: "division", clubs: 24, tournament: "EFL Championship" },
//   { ref: "tour002_one", code: "division", clubs: 20, tournament: "La Liga" },
//   { ref: "tour002_two", code: "division", clubs: 22, tournament: "Segunda División" },
//   { ref: "tour003_one", code: "division", clubs: 18, tournament: "Bundesliga" },
//   { ref: "tour003_two", code: "division", clubs: 18, tournament: "2. Bundesliga" },
//   { ref: "tour004_one", code: "division", clubs: 20, tournament: "Serie A" },
//   { ref: "tour004_two", code: "division", clubs: 20, tournament: "Serie B" },
//   { ref: "tour005_one", code: "division", clubs: 18, tournament: "Ligue 1" },
//   { ref: "tour005_two", code: "division", clubs: 20, tournament: "Ligue 2" },
//   { ref: "tour006_one", code: "division", clubs: 20, tournament: "Copa Libertadores" },
//   { ref: "tour007_one", code: "division", clubs: 18, tournament: "Primeira Lig_one" },
//   { ref: "tour008_one", code: "division", clubs: 18, tournament: "Eredivisie" },
//   { ref: "tour009_one", code: "division", clubs: 18, tournament: "Saudi Pro League" },
//   { ref: "tour010_one", code: "division", clubs: 12, tournament: "Scottish Premiership" },
//   { ref: "tour011_one", code: "division", clubs: 20, tournament: "Süper Lig" },
//   { ref: "tour001_cup", code: "cup", clubs: 32, tournament: "FA Cup" },
//   { ref: "tour002_cup", code: "cup", clubs: 32, tournament: "Copa del Rey" },
//   { ref: "tour003_cup", code: "cup", clubs: 32, tournament: "DFB-Pokal" },
//   { ref: "tour004_cup", code: "cup", clubs: 32, tournament: "Coppa Italia" },
//   { ref: "tour005_cup", code: "cup", clubs: 32, tournament: "Coupe de France" },
//   { ref: "tour006_cup", code: "cup", clubs: 16, tournament: "Copa do Brasil" },
//   { ref: "tour007_cup", code: "cup", clubs: 16, tournament: "Taça de Portugal" },
//   { ref: "tour008_cup", code: "cup", clubs: 16, tournament: "KNVB Cup" },
//   { ref: "tour009_cup", code: "cup", clubs: 16, tournament: "King Cup" },
//   { ref: "tour010_cup", code: "cup", clubs: 8, tournament: "Scottish Cup" },
//   { ref: "tour011_cup", code: "cup", clubs: 16, tournament: "Turkish Cup " },
// ];
