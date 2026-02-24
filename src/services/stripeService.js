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
      return user;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (!user) return null;
      user.subscriptionStatus = "past_due";
      await user.save({ validateBeforeSave: false });
      return user;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: sub.id });
      if (!user) return null;
      // update status
      user.subscriptionStatus = sub.status;
      if (sub.status !== "active") {
        user.subscriptionPlan = "free";
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
  if (!user.stripeSubscriptionId) {
    throw new Error('No active subscription to cancel');
  }
  // cancel immediately; you could also set cancel_at_period_end if desired
  const sub = await stripe.subscriptions.del(user.stripeSubscriptionId);

  // update local record to match Stripe state (the webhook handler will also cover this)
  user.subscriptionStatus = sub.status;
  if (sub.status !== 'active') {
    user.subscriptionPlan = 'free';
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
