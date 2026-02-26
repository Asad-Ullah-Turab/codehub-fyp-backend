import stripeService from "../services/stripeService.js";
import SubscriptionCancellation from "../models/SubscriptionCancellation.js";
import { createNotification } from "./notificationController.js";

// Create a checkout session and return the URL
export const createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const session = await stripeService.createCheckoutSession(user);
    res.status(200).json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Provide current subscription status for the logged in user
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    res.status(200).json({
      success: true,
      data: {
        plan: user.subscriptionPlan,
        status: user.subscriptionStatus,
        chatQueriesRemaining: user.chatQueriesRemaining,
        codeQueriesRemaining: user.codeQueriesRemaining,
        tutorialGenRemaining: user.tutorialGenRemaining,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Webhook handler (no auth)
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (webhookSecret) {
      event = stripeService.stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret,
      );
    } else {
      // testing without secret
      event = req.body;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const result = await stripeService.handleWebhookEvent(event);
    if (result) {
      console.log('Webhook processed successfully for user:', result.email);
    }
  } catch (processError) {
    console.error('Error processing webhook event:', processError.message);
    // still return 200 to avoid retries if our endpoint is misbehaving
  }

  res.status(200).json({ received: true });
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'No active subscription found' });
    }
    const sub = await stripeService.cancelSubscription(user);

    // log cancellation event
    try {
      await SubscriptionCancellation.create({
        user: user._id,
        stripeSubscriptionId: user.stripeSubscriptionId,
        cancelledAt: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      });
    } catch (logErr) {
      console.error('Failed to record cancellation event:', logErr);
    }

    // create notification about cancellation
    try {
      await createNotification({
        userId: user._id,
        type: 'subscription',
        message: 'Your premium subscription has been cancelled. You have been moved to the free plan.',
      });
    } catch (notifErr) {
      console.error('Failed to create cancellation notification:', notifErr);
    }

    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createCheckoutSession,
  getSubscriptionStatus,
  stripeWebhook,
  cancelSubscription,
};
