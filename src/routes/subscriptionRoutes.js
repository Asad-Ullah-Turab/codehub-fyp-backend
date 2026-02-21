import express from 'express';
import subscriptionController from '../controllers/subscriptionController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// create checkout session for logged-in user
router.post('/create-checkout-session', auth, subscriptionController.createCheckoutSession);

// get current status
router.get('/status', auth, subscriptionController.getSubscriptionStatus);

// stripe webhook endpoint (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.stripeWebhook);

export default router;