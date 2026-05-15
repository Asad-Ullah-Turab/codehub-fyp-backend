import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  getCreatorStatus,
  cancelCreatorPro,
  startConnectOnboarding,
  getConnectStatus,
  getPayouts,
  triggerPayouts,
} from "../controllers/creatorSubscriptionController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

router.post("/create-checkout-session", createCheckoutSession);
router.get("/status", getCreatorStatus);
router.post("/cancel", cancelCreatorPro);
router.post("/connect/onboard", startConnectOnboarding);
router.get("/connect/status", getConnectStatus);
router.get("/payouts", getPayouts);
router.post("/payouts/trigger", triggerPayouts);

export default router;
