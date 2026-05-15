import express from "express";
import auth from "../middleware/authMiddleware.js";
import creatorMiddleware from "../middleware/creatorMiddleware.js";
import {
  createCourse,
  getMyCourses,
  updateCourse,
  requestPublishCourse,
  togglePublishCourse,
  deleteCourse,
  getCourse,
  getCourseEnrollments,
  getCourseRatings,
  getCourseReviewsForCreator,
  getCreatorReviewsSummary,
  generateSectionWithAI,
  getCourseAnalytics,
} from "../controllers/creatorCourseController.js";
import courseAdminController from "../controllers/courseAdminController.js";

const router = express.Router();

router.post("/", auth, creatorMiddleware, createCourse);
router.get("/my-courses", auth, creatorMiddleware, getMyCourses);
router.get("/:id", auth, creatorMiddleware, getCourse);
router.put("/:id", auth, creatorMiddleware, updateCourse);
router.patch(
  "/:id/publish-request",
  auth,
  creatorMiddleware,
  requestPublishCourse,
);
router.patch("/:id/publish", auth, creatorMiddleware, togglePublishCourse);
router.delete("/:id", auth, creatorMiddleware, deleteCourse);
router.get("/:id/enrollments", auth, creatorMiddleware, getCourseEnrollments);
router.get("/:id/ratings", auth, creatorMiddleware, getCourseRatings);

router.get("/:courseId/analytics", auth, creatorMiddleware, getCourseAnalytics);

// Section Management
router.post(
  "/:courseId/sections",
  auth,
  creatorMiddleware,
  courseAdminController.addSection,
);
router.put(
  "/sections/:sectionId",
  auth,
  creatorMiddleware,
  courseAdminController.updateSection,
);
router.delete(
  "/sections/:sectionId",
  auth,
  creatorMiddleware,
  courseAdminController.deleteSection,
);

// Lesson Management
router.post(
  "/sections/:sectionId/lessons",
  auth,
  creatorMiddleware,
  courseAdminController.addLesson,
);
router.get(
  "/sections/:sectionId/lessons",
  auth,
  creatorMiddleware,
  courseAdminController.getSectionLessons,
);
router.put(
  "/lessons/:lessonId",
  auth,
  creatorMiddleware,
  courseAdminController.updateLesson,
);
router.delete(
  "/lessons/:lessonId",
  auth,
  creatorMiddleware,
  courseAdminController.deleteLesson,
);

// Quiz Management
router.post(
  "/:courseId/quizzes",
  auth,
  creatorMiddleware,
  courseAdminController.createOrUpdateQuiz,
);
router.put(
  "/quizzes/:quizId",
  auth,
  creatorMiddleware,
  courseAdminController.createOrUpdateQuiz,
);
router.get(
  "/quizzes/:quizId",
  auth,
  creatorMiddleware,
  courseAdminController.getQuiz,
);
router.delete(
  "/quizzes/:quizId",
  auth,
  creatorMiddleware,
  courseAdminController.deleteQuiz,
);

// Get course sections for creator management
router.get(
  "/:courseId/sections",
  auth,
  creatorMiddleware,
  courseAdminController.getCourseSections,
);

// Review Management
router.get(
  "/:courseId/reviews",
  auth,
  creatorMiddleware,
  getCourseReviewsForCreator,
);
router.get(
  "/reviews/summary",
  auth,
  creatorMiddleware,
  getCreatorReviewsSummary,
);

// AI section generation (Creator Pro only)
router.post(
  "/:courseId/sections/generate-ai",
  auth,
  creatorMiddleware,
  generateSectionWithAI,
);

export default router;
