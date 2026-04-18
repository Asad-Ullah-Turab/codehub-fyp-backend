import express from "express";
import auth from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getPendingPublishRequests,
  reviewPublishRequest,
} from "../controllers/creatorCourseController.js";

const router = express.Router();

router.use(auth, adminMiddleware);

router.get("/pending", getPendingPublishRequests);
router.patch("/:id/review", reviewPublishRequest);

export default router;
