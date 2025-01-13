import express from "express";

// handlers
import * as apihub from "../controllers/apihub";
import hubGuard from "../middleware/publicGuard";
import timeout from "../middleware/timeout";

const router = express.Router({ caseSensitive: true, strict: true });

// internal
router.route("/endpoints").get(apihub.endpoints);
router.route("/endpoints/categories").get(apihub.categories);

// router.route("/endpoints/categories/:category").get(apihub.categories);
router.route("/endpoints/:title").get(apihub.endpoint);

export default router;
