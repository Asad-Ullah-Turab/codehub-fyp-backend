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
  const SubscriptionTransaction = (
    await import("../models/SubscriptionTransaction.js")
  ).default;
  const { createNotification } =
    await import("../controllers/notificationController.js");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Skip creator pro checkout sessions — handled by handleCreatorWebhookEvent
      if (session.metadata?.type === "creator_pro") return null;
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
          type: "subscription_created",
          amount: 9.99,
          currency: "usd",
          status: "completed",
          periodStart: new Date(),
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          description: "Premium Subscription - Monthly",
          transactionDate: new Date(),
          metadata: {
            sessionId: session.id,
            email: email,
          },
        });
        console.log("Subscription transaction recorded for user:", user.email);
      } catch (transactionErr) {
        console.error(
          "Failed to record subscription transaction:",
          transactionErr,
        );
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
      const existingTransactions = await SubscriptionTransaction.countDocuments(
        {
          user: user._id,
          stripeSubscriptionId: subscriptionId,
        },
      );

      if (existingTransactions > 0) {
        try {
          await SubscriptionTransaction.create({
            user: user._id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent || null,
            type: "subscription_renewed",
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency || "usd",
            status: "completed",
            periodStart: invoice.period_start
              ? new Date(invoice.period_start * 1000)
              : null,
            periodEnd: invoice.period_end
              ? new Date(invoice.period_end * 1000)
              : null,
            description: "Premium Subscription Renewal",
            transactionDate: new Date(),
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.number,
            },
          });
          console.log("Subscription renewal recorded for user:", user.email);
        } catch (transactionErr) {
          console.error(
            "Failed to record renewal transaction:",
            transactionErr,
          );
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
          type: "payment_failed",
          amount: invoice.amount_due / 100,
          currency: invoice.currency || "usd",
          status: "failed",
          description: "Payment Failed",
          transactionDate: new Date(),
          metadata: {
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count,
          },
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
      if (
        event.type === "customer.subscription.deleted" ||
        sub.status === "canceled"
      ) {
        try {
          await SubscriptionTransaction.create({
            user: user._id,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            type: "subscription_cancelled",
            amount: 0,
            currency: "usd",
            status: "completed",
            description: "Subscription Cancelled",
            transactionDate: new Date(),
            metadata: {
              canceledAt: sub.canceled_at
                ? new Date(sub.canceled_at * 1000)
                : new Date(),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
          console.log(
            "Subscription cancellation recorded for user:",
            user.email,
          );
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
  const SubscriptionTransaction = (
    await import("../models/SubscriptionTransaction.js")
  ).default;

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
          stripeCustomerId: user.stripeCustomerId || "unknown",
          stripeSubscriptionId: user.stripeSubscriptionId,
          type: "subscription_cancelled",
          amount: 0,
          currency: "usd",
          status: "completed",
          description: "Subscription Cancelled (Manual)",
          transactionDate: new Date(),
          metadata: {
            cancelledBy: "user",
            reason: "User initiated cancellation",
          },
        });
      } catch (transactionErr) {
        console.error(
          "Failed to record cancellation transaction:",
          transactionErr,
        );
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
      type: "subscription_cancelled",
      amount: 0,
      currency: "usd",
      status: "completed",
      description: "Subscription Cancelled",
      transactionDate: new Date(),
      metadata: {
        cancelledBy: "user",
        stripeStatus: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
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

// ─── Creator Pro ─────────────────────────────────────────────────────────────

/**
 * Create a checkout session for the Creator Pro plan
 */
export async function createCreatorProCheckoutSession(user) {
  if (!process.env.STRIPE_PRICE_ID_CREATOR_PRO) {
    throw new Error("Price ID for Creator Pro plan not configured");
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID_CREATOR_PRO, quantity: 1 }],
    metadata: { userId: user._id.toString(), type: "creator_pro" },
    success_url: `${process.env.FRONTEND_URL}/creator/earnings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/creator/earnings`,
  });
  return session;
}

/**
 * Handle Stripe webhook events for creator subscriptions
 */
export async function handleCreatorWebhookEvent(event) {
  const User = (await import("../models/User.js")).default;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.metadata?.type !== "creator_pro") return null;
      const user = await User.findOne({ email: session.customer_email });
      if (!user) return null;
      user.creatorPlan = "pro";
      user.creatorPlanStatus = "active";
      user.stripeCreatorCustomerId = session.customer;
      user.stripeCreatorSubscriptionId = session.subscription;
      user.creatorPlanStart = new Date();
      await user.save({ validateBeforeSave: false });
      console.log("Creator Pro activated for:", user.email);
      return user;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const user = await User.findOne({ stripeCreatorSubscriptionId: invoice.subscription });
      if (!user) return null;
      user.creatorPlanStatus = "past_due";
      await user.save({ validateBeforeSave: false });
      return user;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const user = await User.findOne({ stripeCreatorSubscriptionId: sub.id });
      if (!user) return null;
      if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
        user.creatorPlan = "free";
        user.creatorPlanStatus = "canceled";
      } else {
        user.creatorPlanStatus = sub.status;
      }
      await user.save({ validateBeforeSave: false });
      return user;
    }
    default:
      return null;
  }
}

/**
 * Cancel the Creator Pro subscription in Stripe and update user
 */
export async function cancelCreatorProSubscription(user) {
  if (!user.stripeCreatorSubscriptionId) {
    throw new Error("No active Creator Pro subscription to cancel");
  }
  const sub = await stripe.subscriptions.cancel(user.stripeCreatorSubscriptionId);
  user.creatorPlan = "free";
  user.creatorPlanStatus = "canceled";
  await user.save({ validateBeforeSave: false });
  return sub;
}

// ─── Stripe Connect ───────────────────────────────────────────────────────────

/**
 * Create a Stripe Connect Express account for a creator and return onboarding URL.
 * In development mode, skips the real Stripe Connect flow and instantly marks
 * the creator as connected so the full earnings UI can be tested locally.
 */
export async function createConnectAccountLink(user) {
  if (process.env.NODE_ENV === "development") {
    user.stripeConnectAccountId = `acct_test_dev_${user._id}`;
    user.stripeConnectOnboardingComplete = true;
    user.stripeConnectPayoutsEnabled = true;
    await user.save({ validateBeforeSave: false });
    return `${process.env.FRONTEND_URL}/creator/earnings?connect=success`;
  }

  let accountId = user.stripeConnectAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: { transfers: { requested: true } },
      metadata: { userId: user._id.toString() },
    });
    accountId = account.id;
    user.stripeConnectAccountId = accountId;
    await user.save({ validateBeforeSave: false });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.FRONTEND_URL}/creator/earnings?connect=refresh`,
    return_url: `${process.env.FRONTEND_URL}/creator/earnings?connect=success`,
    type: "account_onboarding",
  });

  return link.url;
}

/**
 * Refresh Connect account status from Stripe and sync to user.
 * In development, test accounts always report as fully enabled.
 */
export async function syncConnectAccountStatus(user) {
  if (!user.stripeConnectAccountId) return null;
  if (process.env.NODE_ENV === "development" && user.stripeConnectAccountId.startsWith("acct_test_dev_")) {
    return { details_submitted: true, payouts_enabled: true };
  }
  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
  user.stripeConnectOnboardingComplete = account.details_submitted;
  user.stripeConnectPayoutsEnabled = account.payouts_enabled;
  await user.save({ validateBeforeSave: false });
  return account;
}

// ─── Monthly payouts ──────────────────────────────────────────────────────────

const CREATOR_REVENUE_SHARE = 0.40; // 40 % of premium revenue goes to creator pool

/**
 * Calculate and process monthly payouts for all creators.
 * Called by the monthly cron job.
 */
export async function processMonthlyCreatorPayouts() {
  const User = (await import("../models/User.js")).default;
  const CourseEnrollment = (await import("../models/CourseEnrollment.js")).default;
  const Course = (await import("../models/Course.js")).default;
  const SubscriptionTransaction = (await import("../models/SubscriptionTransaction.js")).default;
  const CreatorPayout = (await import("../models/CreatorPayout.js")).default;

  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();

  // 1. Total premium revenue this month
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

  const revenueAgg = await SubscriptionTransaction.aggregate([
    {
      $match: {
        type: { $in: ["subscription_created", "subscription_renewed"] },
        status: "completed",
        transactionDate: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalPremiumRevenue = revenueAgg[0]?.total || 0;
  const sharePool = totalPremiumRevenue * CREATOR_REVENUE_SHARE;

  if (sharePool === 0) {
    console.log("No premium revenue this month — skipping creator payouts");
    return;
  }

  // 2. Enrollments per creator this month
  const enrollmentAgg = await CourseEnrollment.aggregate([
    { $match: { enrollmentDate: { $gte: startOfMonth, $lte: endOfMonth } } },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseDoc",
      },
    },
    { $unwind: "$courseDoc" },
    { $match: { "courseDoc.instructor": { $exists: true } } },
    { $group: { _id: "$courseDoc.instructor", count: { $sum: 1 } } },
  ]);

  const totalEnrollments = enrollmentAgg.reduce((sum, e) => sum + e.count, 0);
  if (totalEnrollments === 0) {
    console.log("No enrollments this month — skipping creator payouts");
    return;
  }

  // 3. Create payout record and transfer for each creator
  for (const entry of enrollmentAgg) {
    const creator = await User.findById(entry._id);
    if (!creator || creator.role !== "creator") continue;

    const share = entry.count / totalEnrollments;
    const payoutAmount = parseFloat((share * sharePool).toFixed(2));

    if (!creator.isCreatorPro || !creator.isCreatorPro()) {
      // Record as skipped so admin can see it
      await CreatorPayout.findOneAndUpdate(
        { creator: creator._id, month, year },
        {
          totalPremiumRevenue,
          creatorEnrollments: entry.count,
          totalEnrollments,
          enrollmentShare: share,
          sharePool,
          payoutAmount,
          status: "skipped",
          notes: "Creator does not have an active Creator Pro subscription",
        },
        { upsert: true, new: true },
      );
      continue;
    }

    const payoutDoc = await CreatorPayout.findOneAndUpdate(
      { creator: creator._id, month, year },
      {
        totalPremiumRevenue,
        creatorEnrollments: entry.count,
        totalEnrollments,
        enrollmentShare: share,
        sharePool,
        payoutAmount,
        status: "processing",
      },
      { upsert: true, new: true },
    );

    // Only transfer if creator has Connect account with payouts enabled
    if (creator.stripeConnectAccountId && creator.stripeConnectPayoutsEnabled) {
      // Dev test accounts use a fake ID — simulate paid without a real Stripe transfer
      const isDevAccount = creator.stripeConnectAccountId.startsWith("acct_test_dev_");
      if (isDevAccount) {
        payoutDoc.stripeTransferId = `tr_dev_simulated_${Date.now()}`;
        payoutDoc.status = "paid";
        payoutDoc.paidAt = new Date();
      } else {
        try {
          const transfer = await stripe.transfers.create({
            amount: Math.round(payoutAmount * 100), // cents
            currency: "usd",
            destination: creator.stripeConnectAccountId,
            description: `CodeHub creator payout ${month}/${year}`,
          });
          payoutDoc.stripeTransferId = transfer.id;
          payoutDoc.status = "paid";
          payoutDoc.paidAt = new Date();
        } catch (err) {
          payoutDoc.status = "failed";
          payoutDoc.notes = err.message;
          console.error(`Payout failed for creator ${creator.email}:`, err.message);
        }
      }
    } else {
      payoutDoc.status = "pending";
      payoutDoc.notes = "Creator has not completed Stripe Connect onboarding";
    }

    await payoutDoc.save();
    console.log(`Payout ${payoutDoc.status} for ${creator.email}: $${payoutAmount}`);
  }

  console.log(`Monthly creator payouts processed. Pool: $${sharePool.toFixed(2)} from $${totalPremiumRevenue.toFixed(2)} premium revenue`);
}

export { stripe };
export default {
  createCheckoutSession,
  handleWebhookEvent,
  cancelSubscription,
  createCreatorProCheckoutSession,
  handleCreatorWebhookEvent,
  cancelCreatorProSubscription,
  createConnectAccountLink,
  syncConnectAccountStatus,
  processMonthlyCreatorPayouts,
  stripe,
};
