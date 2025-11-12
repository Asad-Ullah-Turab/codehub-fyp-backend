import express from "express";
import courseController from "../controllers/courseController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get("/", courseController.getAllCourses);
router.get("/language/:language", courseController.getCoursesByLanguage);
router.get("/:id", courseController.getCourseById);

// ========== PROTECTED ROUTES - ENROLLMENT ==========
router.post("/enroll", auth, courseController.enrollInCourse);
router.get("/user/enrolled", auth, courseController.getUserEnrolledCourses);
router.get("/:courseId/enrollment", auth, courseController.getEnrollmentDetails);

// ========== PROGRESS TRACKING ==========
router.put(
  "/:courseId/progress/lesson",
  auth,
  courseController.completeLessonProgress
);

export default router;
