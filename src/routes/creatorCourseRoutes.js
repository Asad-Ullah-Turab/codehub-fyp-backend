import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  createCourse,
  getMyCourses,
  updateCourse,
  requestPublishCourse,
} from "../controllers/creatorCourseController.js";

const router = express.Router();

router.post("/", auth, createCourse);
router.get("/my-courses", auth, getMyCourses);
router.put("/:id", auth, updateCourse);
router.patch("/:id/publish-request", auth, requestPublishCourse);

export default router;
