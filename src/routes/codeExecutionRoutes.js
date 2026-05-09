import express from "express";
import codeExecutionController from "../controllers/codeExecutionController.js";
import { auth } from "../middleware/authMiddleware.js";
import { resourceLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

router.post(
  "/execute",
  auth,
  resourceLimiter,
  codeExecutionController.executeCode,
);
router.get("/languages", codeExecutionController.getLanguages);

export default router;

