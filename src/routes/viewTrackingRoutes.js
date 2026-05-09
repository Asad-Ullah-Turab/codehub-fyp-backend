import express from "express";
import {
  incrementTutorialView,
  incrementCourseView,
  getMostViewedTutorials,
  getMostViewedCourses,
  getMostViewedContent,
} from "../controllers/viewTrackingController.js";
import { generalLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Track views with rate limiting
router.post(
  "/tutorials/:tutorialId/view",
  generalLimiter,
  incrementTutorialView,
);
router.post("/courses/:courseId/view", generalLimiter, incrementCourseView);

// Get most viewed content
router.get("/tutorials/most-viewed", generalLimiter, getMostViewedTutorials);
router.get("/courses/most-viewed", generalLimiter, getMostViewedCourses);
router.get("/most-viewed", generalLimiter, getMostViewedContent);

export default router;
