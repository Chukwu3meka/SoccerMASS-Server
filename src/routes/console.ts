import * as handler from "../controllers/console";
import express, { Request, Response } from "express";

import { codes } from "../utils/codes";
import { formatDate } from "../utils/handlers";
import { INFO_ALL_FAILED_REQUESTS } from "../models/info.model";

const fallbackRoute = async (req: Request, res: Response) => {
  await INFO_ALL_FAILED_REQUESTS.create({
    error: "Invalid Console route",
    date: formatDate(new Date()),
    data: codes["Invalid Console Route"],
    request: { body: JSON.stringify(req.body), headers: JSON.stringify(req.headers) },
  });

  return res.status(200).json({ success: true, message: new Date().toDateString(), data: codes["Invalid Console Route"] });
};

const router = express.Router({ caseSensitive: true, strict: true });

// Routes
router.route("/apihub/endpoints").get(handler.endpoints);
router.route("/apihub/endpoints/:id").get(handler.endpoint);
router.route("/apihub/endpoint-title-exists").post(handler.endpointTitleExists);
router.route("/apihub/compose-endpoint").post(handler.composeEndpoint);
router.route("/apihub/save-endpoint").post(handler.saveEndpoints);
router.route("/apihub/toggle-endpoint-visibility").post(handler.toggleEndpointVisibility);
router.route("/apihub/delete-endpoint").post(handler.deleteEndpoint);

router.route("/logs/daily-statistics").get(handler.dailyStatistics);
router.route("/logs/all-requests").get(handler.allRequests);
router.route("/logs/failed-requests").get(handler.failedRequests);

router.route("/games/game-worlds").post(handler.createGameWorld);
router.route("/games/game-worlds").get(handler.getGameWorlds);
router.route("/games/game-worlds/:id").get(handler.createGameWorld);
router.route("/games/game-worlds/:id").patch(handler.createGameWorld);

// ? fallback route
router.route("*").all(fallbackRoute);

export default router;
