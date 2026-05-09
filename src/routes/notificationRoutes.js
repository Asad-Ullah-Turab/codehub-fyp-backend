import express from "express";
import notificationController from "../controllers/notificationController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// get current user's notifications
router.get("/", auth, notificationController.getNotifications);

// mark notification as read
router.post("/mark-read", auth, notificationController.markAsRead);

// mark all notifications read
router.post(
  "/mark-all-read",
  auth,
  notificationController.markAllNotificationsRead,
);

export default router;
