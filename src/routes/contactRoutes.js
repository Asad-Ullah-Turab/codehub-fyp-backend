import express from "express";
import {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  replyToContact,
} from "../controllers/contactController.js";
import { auth } from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { contactLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Public route - Submit contact form with rate limiting
router.post("/", contactLimiter, submitContact);

// Admin routes - Manage contact submissions
router.get("/", auth, adminMiddleware, getAllContacts);
router.get("/:id", auth, adminMiddleware, getContactById);
router.post("/:id/reply", auth, adminMiddleware, replyToContact);
router.patch("/:id", auth, adminMiddleware, updateContactStatus);
router.delete("/:id", auth, adminMiddleware, deleteContact);

export default router;
