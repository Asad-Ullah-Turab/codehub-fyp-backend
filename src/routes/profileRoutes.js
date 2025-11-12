import express from "express";
import * as profileController from "../controllers/profileController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PROFILE MANAGEMENT ==========
router.get("/", auth, profileController.getProfile);
router.put("/", auth, profileController.updateProfile);

// ========== PROGRESS TRACKING ==========
router.get("/progress/courses", auth, profileController.getCourseProgress);
router.get("/progress/tutorials", auth, profileController.getTutorialProgress);
router.get("/dashboard", auth, profileController.getDashboardStats);

// ========== ENROLLMENT MANAGEMENT ==========
router.get("/enrollments", auth, profileController.getUserEnrollments);
router.put("/enrollments/:enrollmentId/status", auth, profileController.updateEnrollmentStatus);

export default router;