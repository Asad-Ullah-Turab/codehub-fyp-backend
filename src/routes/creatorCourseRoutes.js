import express from "express";
import auth from "../middleware/authMiddleware.js";
import creatorMiddleware from "../middleware/creatorMiddleware.js";
import {
  createCourse,
  getMyCourses,
  updateCourse,
  requestPublishCourse,
} from "../controllers/creatorCourseController.js";

const router = express.Router();

router.post("/", auth, creatorMiddleware, createCourse);
router.get("/my-courses", auth, creatorMiddleware, getMyCourses);
router.put("/:id", auth, creatorMiddleware, updateCourse);
router.patch("/:id/publish-request", auth, creatorMiddleware, requestPublishCourse);

export default router;
