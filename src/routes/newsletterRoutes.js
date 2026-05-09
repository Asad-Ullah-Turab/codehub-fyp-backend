import express from "express";
import {
  subscribe,
  unsubscribe,
  getStatus,
} from "../controllers/newsletterController.js";
import {
  contactLimiter,
  generalLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Newsletter subscription routes with rate limiting
router.post("/subscribe", contactLimiter, subscribe);
router.post("/unsubscribe", contactLimiter, unsubscribe);
router.get("/status", generalLimiter, getStatus);

export default router;

