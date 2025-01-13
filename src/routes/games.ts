import express, { Request, Response } from "express";

// handlers
import * as managerHandler from "../controllers/games";
import { codes } from "../utils/codes";

const router = express.Router({ caseSensitive: true, strict: true });

router.route("/get-profile").get(managerHandler.getProfile);
router.route("/game-worlds/:title").get(managerHandler.getGameWorlds);
router.route("/game-worlds").get(managerHandler.getGameWorlds);
router.route("/club/:world/:club").get(managerHandler.getWorldClub);
router.route("/clubs/:world/:division").get(managerHandler.getWorldClubs);
// router.route("/game-worlds/club").get(managerHandler.getGameWorld);

export default router;
