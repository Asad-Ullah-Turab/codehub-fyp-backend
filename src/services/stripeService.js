import Stripe from "stripe";

// Initialize stripe using secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

/**
 * Create a checkout session for upgrading to premium plan
 * @param {Object} user - Mongoose user document
 */
export async function createCheckoutSession(user) {
  if (!process.env.STRIPE_PRICE_ID_PREMIUM) {
    throw new Error("Price ID for premium plan not configured");
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID_PREMIUM,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription-cancelled`,
  });
  return session;
}

/**
 * Handle a Stripe webhook event to update user subscription
 * @param {Object} event - Stripe event payload
 * @returns {Object|null} updated user or null if ignored
 */
export async function handleWebhookEvent(event) {
  const User = (await import("../models/User.js")).default;
  const SubscriptionTransaction = (await import("../models/SubscriptionTransaction.js")).default;
  const { createNotification } =
    await import("../controllers/notificationController.js");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // We can look up user by email
      const email = session.customer_email;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      const user = await User.findOne({ email });
      if (!user) {
        console.log("User not found for email:", email);
        return null;
      }

      user.subscriptionPlan = "premium";
      user.subscriptionStatus = "active";
      user.stripeCustomerId = customerId;
      user.stripeSubscriptionId = subscriptionId;
      user.subscriptionStart = new Date();
      user.chatQueriesRemaining = 9999; // practically unlimited
      user.codeQueriesRemaining = 9999;
      user.tutorialGenRemaining = 9999;

      await user.save({ validateBeforeSave: false });
      console.log("User successfully upgraded to premium:", user.email);

      // Create subscription transaction record
      try {
        await SubscriptionTransaction.create({
          user: user._id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePaymentIntentId: session.payment_intent || null,
          type: 'subscription_created',
          amount: 9.99,
          currency: 'usd',
          status: 'completed',
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          description: 'Premium Subscription - Monthly',
          transactionDate: new Date(),
          metadata: {
            sessionId: session.id,
            email: email
          }
        });
        console.log("Subscription transaction recorded for user:", user.email);
      } catch (transactionErr) {
        console.error("Failed to record subscription transaction:", transactionErr);
      }

      // create notification
      try {
        await createNotification({
          userId: user._id,
          type: "subscription",
          message:
            "Your subscription to Premium is now active! Enjoy unlimited access.",
        });
      } catch (notifErr) {
        console.error("Failed to create upgrade notification:", notifErr);
      }

      return user;
    }
    case "invoice.payment_succeeded": {
      // Track successful subscription renewals
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      if (!subscriptionId) return null;
      
      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (!user) return null;

      // Only record if this is a renewal (not the initial payment)
      const existingTransactions = await SubscriptionTransaction.countDocuments({
        user: user._id,
        stripeSubscriptionId: subscriptionId
      });

      if (existingTransactions > 0) {
        try {
          await SubscriptionTransaction.create({
            user: user._id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent || null,
            type: 'subscription_renewed',
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency || 'usd',
            status: 'completed',
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            description: 'Premium Subscription Renewal',
            transactionDate: new Date(),
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.number
            }
          });
          console.log("Subscription renewal recorded for user:", user.email);
        } catch (transactionErr) {
          console.error("Failed to record renewal transaction:", transactionErr);
        }
      }

      return user;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (!user) return null;
      
      user.subscriptionStatus = "past_due";
      await user.save({ validateBeforeSave: false });

      // Record failed payment
      try {
        await SubscriptionTransaction.create({
          user: user._id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeInvoiceId: invoice.id,
          type: 'payment_failed',
          amount: invoice.amount_due / 100,
          currency: invoice.currency || 'usd',
          status: 'failed',
          description: 'Payment Failed',
          transactionDate: new Date(),
          metadata: {
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count
          }
        });
        console.log("Failed payment recorded for user:", user.email);
      } catch (transactionErr) {
        console.error("Failed to record failed payment:", transactionErr);
      }

      return user;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: sub.id });
      if (!user) return null;
      
      // If subscription is being cancelled
      if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
        try {
          await SubscriptionTransaction.create({
            user: user._id,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            type: 'subscription_cancelled',
            amount: 0,
            currency: 'usd',
            status: 'completed',
            description: 'Subscription Cancelled',
            transactionDate: new Date(),
            metadata: {
              canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : new Date(),
              cancelAtPeriodEnd: sub.cancel_at_period_end
            }
          });
          console.log("Subscription cancellation recorded for user:", user.email);
        } catch (transactionErr) {
          console.error("Failed to record cancellation:", transactionErr);
        }
      }
      
      // update status
      user.subscriptionStatus = sub.status;
      if (sub.status !== "active") {
        user.subscriptionPlan = "free";
        // Reset to free tier limits when downgrading
        user.chatQueriesRemaining = 5;
        user.codeQueriesRemaining = 5;
        user.tutorialGenRemaining = 5;
      }
      await user.save({ validateBeforeSave: false });
      return user;
    }
    default:
      // ignore other events
      return null;
  }
}

/**
 * Cancel an existing subscription in Stripe and update local user record.
 * @param {Object} user - Mongoose user document
 * @returns {Object} stripe subscription object returned by the API
 */
export async function cancelSubscription(user) {
  const SubscriptionTransaction = (await import("../models/SubscriptionTransaction.js")).default;
  
  if (!user.stripeSubscriptionId) {
    throw new Error("No active subscription to cancel");
  }

  let sub;
  try {
    // cancel immediately; you could also set cancel_at_period_end if desired
    sub = await stripe.subscriptions.del(user.stripeSubscriptionId);
  } catch (err) {
    // if the subscription was already removed on Stripe side, treat as cancelled
    if (
      err &&
      err.type === "StripeInvalidRequestError" &&
      err.code === "resource_missing"
    ) {
      console.warn(
        "Stripe subscription not found, clearing local subscription id for user",
        user._id,
      );
      // update user record to free plan
      user.subscriptionStatus = "canceled";
      user.subscriptionPlan = "free";
      // Reset to free tier limits when downgrading
      user.chatQueriesRemaining = 5;
      user.codeQueriesRemaining = 5;
      user.tutorialGenRemaining = 5;
      
      // Record cancellation transaction
      try {
        await SubscriptionTransaction.create({
          user: user._id,
          stripeCustomerId: user.stripeCustomerId || 'unknown',
          stripeSubscriptionId: user.stripeSubscriptionId,
          type: 'subscription_cancelled',
          amount: 0,
          currency: 'usd',
          status: 'completed',
          description: 'Subscription Cancelled (Manual)',
          transactionDate: new Date(),
          metadata: {
            cancelledBy: 'user',
            reason: 'User initiated cancellation'
          }
        });
      } catch (transactionErr) {
        console.error("Failed to record cancellation transaction:", transactionErr);
      }
      
      user.stripeSubscriptionId = undefined;
      await user.save({ validateBeforeSave: false });
      // return a fake response so controller still works
      return { id: user.stripeSubscriptionId || null, status: "canceled" };
    }
    throw err;
  }

  // Record cancellation transaction
  try {
    await SubscriptionTransaction.create({
      user: user._id,
      stripeCustomerId: user.stripeCustomerId || sub.customer,
      stripeSubscriptionId: user.stripeSubscriptionId,
      type: 'subscription_cancelled',
      amount: 0,
      currency: 'usd',
      status: 'completed',
      description: 'Subscription Cancelled',
      transactionDate: new Date(),
      metadata: {
        cancelledBy: 'user',
        stripeStatus: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      }
    });
    console.log("Cancellation transaction recorded for user:", user.email);
  } catch (transactionErr) {
    console.error("Failed to record cancellation transaction:", transactionErr);
  }

  // update local record to match Stripe state (the webhook handler will also cover this)
  user.subscriptionStatus = sub.status;
  if (sub.status !== "active") {
    user.subscriptionPlan = "free";
    // Reset to free tier limits when downgrading
    user.chatQueriesRemaining = 5;
    user.codeQueriesRemaining = 5;
    user.tutorialGenRemaining = 5;
  }
  await user.save({ validateBeforeSave: false });
  return sub;
}

export { stripe };
export default {
  createCheckoutSession,
  handleWebhookEvent,
  cancelSubscription,
  stripe,
};
