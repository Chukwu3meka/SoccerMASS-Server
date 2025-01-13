import express from "express";
import * as handlers from "../controllers";

const router = express.Router({ caseSensitive: true, strict: true });

// ? external/public routes
router.route("/clubs/random").get(handlers.randomClubs);
router.route("/clubs/:ref").get(handlers.club);
router.route("/tournament/clubs/:division").get(handlers.getDivisionClubs);

// router.route("/:club/players").get(handlers.clubPlayers);

router.route("/players/random").get(handlers.randomPlayers);
// router.route("/players/club/:ref").get(handlers.clubPlayers);
router.route("/ref/players").get(handlers.playersByReference);

router.route("/tournament").get(handlers.getTournament);

router.route("/others/reference-resolver").get(handlers.referenceResolver);

export default router;
