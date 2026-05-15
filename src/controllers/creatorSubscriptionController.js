import {
  createCreatorProCheckoutSession,
  cancelCreatorProSubscription,
  createConnectAccountLink,
  syncConnectAccountStatus,
  processMonthlyCreatorPayouts,
} from "../services/stripeService.js";
import CreatorPayout from "../models/CreatorPayout.js";
import User from "../models/User.js";
import geminiService from "../services/geminiService.js";

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
    const userWithKey = await User.findById(req.user._id).select("+geminiApiKey");
    res.json({
      success: true,
      data: {
        creatorPlan: req.user.creatorPlan,
        creatorPlanStatus: req.user.creatorPlanStatus,
        creatorPlanStart: req.user.creatorPlanStart,
        creatorPlanEnd: req.user.creatorPlanEnd,
        isCreatorPro: req.user.isCreatorPro(),
        stripeConnectAccountId: req.user.stripeConnectAccountId,
        stripeConnectOnboardingComplete: req.user.stripeConnectOnboardingComplete,
        stripeConnectPayoutsEnabled: req.user.stripeConnectPayoutsEnabled,
        hasGeminiApiKey: !!userWithKey?.geminiApiKey,
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

// PUT /api/creator-subscription/gemini-key
export const saveGeminiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ success: false, message: "API key is required" });
    }
    const key = apiKey.trim();
    // Basic format check: Google AI Studio keys start with "AIza" and are 39 chars
    if (!key.startsWith("AIza") || key.length < 30) {
      return res.status(400).json({ success: false, message: "That doesn't look like a valid Google AI Studio key. Keys start with 'AIza'." });
    }
    await User.findByIdAndUpdate(req.user._id, { geminiApiKey: key });
    res.json({ success: true, message: "Gemini API key saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/creator-subscription/gemini-key
export const deleteGeminiKey = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { geminiApiKey: null });
    res.json({ success: true, message: "Gemini API key removed" });
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
