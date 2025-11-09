import express from "express";
import auth from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  changeUserRole,
  deleteUser,
  getAllTutorials,
  updateTutorial,
  deleteTutorial,
  createTutorial,
  getAnalytics,
  searchUsers,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(auth, adminMiddleware);

// Dashboard statistics
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/search", searchUsers);
router.put("/users/:userId/status", updateUserStatus);
router.put("/users/:userId/role", changeUserRole);
router.delete("/users/:userId", deleteUser);

// Tutorial management
router.get("/tutorials", getAllTutorials);
router.post("/tutorials", createTutorial);
router.put("/tutorials/:tutorialId", updateTutorial);
router.delete("/tutorials/:tutorialId", deleteTutorial);

// Analytics
router.get("/analytics", getAnalytics);

export default router;
