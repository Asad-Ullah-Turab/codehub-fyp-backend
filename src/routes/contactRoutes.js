import express from "express";
import {
  submitContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";
import { auth } from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public route - Submit contact form
router.post("/", submitContact);

// Admin routes - Manage contact submissions
router.get("/", auth, adminMiddleware, getAllContacts);
router.get("/:id", auth, adminMiddleware, getContactById);
router.patch("/:id", auth, adminMiddleware, updateContactStatus);
router.delete("/:id", auth, adminMiddleware, deleteContact);

export default router;
