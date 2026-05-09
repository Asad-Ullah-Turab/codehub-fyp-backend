import express from "express";
import tutorialController from "../controllers/tutorialController.js";
import { auth } from "../middleware/authMiddleware.js";
import { generalLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Protected routes - view tutorials (authentication required)
router.get("/", auth, generalLimiter, tutorialController.getAllTutorials);
router.get("/languages", auth, generalLimiter, tutorialController.getLanguages);
router.get(
  "/language/:language",
  auth,
  generalLimiter,
  tutorialController.getTutorialsByLanguage,
);
router.get(
  "/concepts/:language",
  auth,
  generalLimiter,
  tutorialController.getConceptsByLanguage,
);
router.get("/:id", auth, generalLimiter, tutorialController.getTutorialById);

// Protected routes - save/manage tutorials
router.post("/save", auth, tutorialController.saveTutorial);
router.get("/user/saved", auth, tutorialController.getSavedTutorials);
router.delete("/saved/:tutorialId", auth, tutorialController.unsaveTutorial);
router.put(
  "/progress/:tutorialId",
  auth,
  tutorialController.updateTutorialProgress,
);

// User's created tutorials
router.get("/user/created", auth, tutorialController.getUserCreatedTutorials);
router.delete("/user/created/:id", auth, tutorialController.deleteUserTutorial);

// Create custom tutorial (for future AI integration)
router.post("/create", auth, tutorialController.createTutorial);

export default router;
