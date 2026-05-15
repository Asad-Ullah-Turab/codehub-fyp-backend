import {
  createCreatorProCheckoutSession,
  cancelCreatorProSubscription,
  createConnectAccountLink,
  syncConnectAccountStatus,
  processMonthlyCreatorPayouts,
} from "../services/stripeService.js";
import CreatorPayout from "../models/CreatorPayout.js";

// POST /api/creator-subscription/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "creator") {
      return res.status(403).json({ success: false, message: "Only creators can subscribe to Creator Pro" });
    }
    if (user.isCreatorPro()) {
      return res.status(400).json({ success: false, message: "You already have an active Creator Pro subscription" });
    }
    const session = await createCreatorProCheckoutSession(user);
    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/creator-subscription/status
export const getCreatorStatus = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      data: {
        creatorPlan: user.creatorPlan,
        creatorPlanStatus: user.creatorPlanStatus,
        creatorPlanStart: user.creatorPlanStart,
        creatorPlanEnd: user.creatorPlanEnd,
        isCreatorPro: user.isCreatorPro(),
        stripeConnectAccountId: user.stripeConnectAccountId,
        stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
        stripeConnectPayoutsEnabled: user.stripeConnectPayoutsEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/creator-subscription/cancel
export const cancelCreatorPro = async (req, res) => {
  try {
    const user = req.user;
    if (!user.isCreatorPro()) {
      return res.status(400).json({ success: false, message: "No active Creator Pro subscription" });
    }
    await cancelCreatorProSubscription(user);
    res.json({ success: true, message: "Creator Pro subscription cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/creator-subscription/connect/onboard
export const startConnectOnboarding = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "creator") {
      return res.status(403).json({ success: false, message: "Only creators can connect a payout account" });
    }
    const url = await createConnectAccountLink(user);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/creator-subscription/connect/status
export const getConnectStatus = async (req, res) => {
  try {
    const user = req.user;
    if (user.stripeConnectAccountId) {
      await syncConnectAccountStatus(user);
    }
    res.json({
      success: true,
      data: {
        accountId: user.stripeConnectAccountId,
        onboardingComplete: user.stripeConnectOnboardingComplete,
        payoutsEnabled: user.stripeConnectPayoutsEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/creator-subscription/payouts
export const getPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      CreatorPayout.find({ creator: req.user._id })
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CreatorPayout.countDocuments({ creator: req.user._id }),
    ]);

    res.json({
      success: true,
      data: payouts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/creator-subscription/payouts/trigger  (admin only)
export const triggerPayouts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    await processMonthlyCreatorPayouts();
    res.json({ success: true, message: "Monthly creator payouts processed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
