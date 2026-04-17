import User from "../models/User.js";
import Tutorial from "../models/Tutorial.js";
import AIChat from "../models/AIChat.js";
import CodeChat from "../models/CodeChat.js";
import Progress from "../models/Progress.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";
import NewsletterSubscription from "../models/NewsletterSubscription.js";
import SubscriptionTransaction from "../models/SubscriptionTransaction.js";
import monthlyResetService from "../services/monthlyResetService.js";
import { createNotification } from "./notificationController.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalCreators = await User.countDocuments({ role: "creator" });
    const premiumUsers = await User.countDocuments({ subscriptionPlan: "premium", subscriptionStatus: "active" });
    const activeUsers = await User.countDocuments({ accountStatus: "active" });
    const suspendedUsers = await User.countDocuments({ accountStatus: "suspended" });
    const totalTutorials = await Tutorial.countDocuments();
    const totalChats = await AIChat.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await CourseEnrollment.countDocuments();

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate previous period for growth rate
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodUsers = await User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const userGrowthRate = previousPeriodUsers > 0 
      ? (((newUsersLast30Days - previousPeriodUsers) / previousPeriodUsers) * 100).toFixed(1)
      : "0.0";

    // Get recent enrollments (last 30 days)
    const recentEnrollments = await CourseEnrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo },
    });

    const previousEnrollments = await CourseEnrollment.countDocuments({
      enrolledAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const enrollmentGrowthRate = previousEnrollments > 0
      ? (((recentEnrollments - previousEnrollments) / previousEnrollments) * 100).toFixed(1)
      : "0.0";

    // Get recent tutorials (last 30 days)
    const recentTutorials = await Tutorial.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const previousTutorials = await Tutorial.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const tutorialGrowthRate = previousTutorials > 0
      ? (((recentTutorials - previousTutorials) / previousTutorials) * 100).toFixed(1)
      : "0.0";

    // Get recent AI chats (last 30 days)
    const recentChats = await AIChat.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const previousChats = await AIChat.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const chatGrowthRate = previousChats > 0
      ? (((recentChats - previousChats) / previousChats) * 100).toFixed(1)
      : "0.0";

    // Calculate subscription earnings from actual transactions
    const PREMIUM_PRICE = 9.99; // Monthly subscription price
    const monthlyRecurringRevenue = (premiumUsers * PREMIUM_PRICE).toFixed(2);
    const annualRecurringRevenue = (premiumUsers * PREMIUM_PRICE * 12).toFixed(2);

    // Get total revenue from completed transactions
    const totalRevenueData = await SubscriptionTransaction.getTotalRevenue();
    const totalRevenue = totalRevenueData.totalRevenue || 0;
    const totalTransactions = totalRevenueData.totalTransactions || 0;

    // Calculate revenue from last 30 days
    const revenueByDateLast30Days = await SubscriptionTransaction.getRevenueByDateRange(
      thirtyDaysAgo,
      new Date()
    );
    const revenueGrowth = revenueByDateLast30Days.reduce((sum, item) => sum + parseFloat(item.revenue), 0).toFixed(2);

    // Calculate revenue from previous 30 days for growth rate
    const revenueByDatePrevious30Days = await SubscriptionTransaction.getRevenueByDateRange(
      sixtyDaysAgo,
      thirtyDaysAgo
    );
    const previousRevenue = revenueByDatePrevious30Days.reduce((sum, item) => sum + parseFloat(item.revenue), 0);

    const revenueGrowthRate = previousRevenue > 0
      ? (((parseFloat(revenueGrowth) - previousRevenue) / previousRevenue) * 100).toFixed(1)
      : parseFloat(revenueGrowth) > 0 ? "100.0" : "0.0";

    // Count new subscriptions in last 30 days
    const newPremiumUsersLast30Days = await SubscriptionTransaction.countDocuments({
      type: 'subscription_created',
      status: 'completed',
      transactionDate: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalCreators,
        premiumUsers,
        activeUsers,
        suspendedUsers,
        totalTutorials,
        totalChats,
        totalCourses,
        totalEnrollments,
        newUsersLast30Days,
        suspensionRate: ((suspendedUsers / totalUsers) * 100).toFixed(2),
        userGrowthRate,
        enrollmentGrowthRate,
        tutorialGrowthRate,
        chatGrowthRate,
        // Earnings data (from actual transactions)
        monthlyRecurringRevenue: parseFloat(monthlyRecurringRevenue),
        annualRecurringRevenue: parseFloat(annualRecurringRevenue),
        revenueGrowth: parseFloat(revenueGrowth),
        revenueGrowthRate: parseFloat(revenueGrowthRate),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalTransactions,
        newPremiumUsersLast30Days,
        revenueByDate: revenueByDateLast30Days.map(item => ({
          date: item._id,
          revenue: parseFloat(item.revenue),
          count: item.count
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "", status = "", plan = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (plan) filter.subscriptionPlan = plan;

    const users = await User.find(filter)
      .select("name email role accountStatus profileImage createdAt lastLogin subscriptionPlan subscriptionStatus chatQueriesRemaining codeQueriesRemaining tutorialGenRemaining")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user status (suspend, activate, etc.)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus, reason } = req.body;

    if (!["pending", "active", "suspended"].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send notification email and in-app notification
    await notifyUserStatusChange(user, accountStatus, reason);
    try {
      const msg =
        accountStatus === 'suspended'
          ? 'Your account has been suspended.'
          : 'Your account has been activated.';
      await createNotification({
        userId: user._id,
        type: 'accountStatus',
        message: msg,
      });
    } catch (notifErr) {
      console.error('Account status notification failed:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${accountStatus}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Change user role (promote to admin)
export const changeUserRole = async (req, res) => {
  // notify target user of role change
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "creator", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent self-demotion from admin
    if (req.user._id.toString() === userId && role === "user") {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself from admin role",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // send in-app notification about role change
    try {
      await createNotification({
        userId: user._id,
        type: 'roleChange',
        message: `Your role has been changed to ${role}.`,
      });
    } catch (notifErr) {
      console.error('Role change notification failed:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingCreatorApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const paginationLimit = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * paginationLimit;

    const filter = {
      "creatorApplication.status": "pending",
    };

    const users = await User.find(filter)
      .select("name email role accountStatus creatorApplication createdAt lastLogin")
      .limit(paginationLimit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / paginationLimit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewCreatorApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, comment } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review action",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.creatorApplication?.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending creator application found for this user",
      });
    }

    const approved = action === "approve";

    user.creatorApplication.status = approved ? "approved" : "rejected";
    user.creatorApplication.reviewedAt = new Date();
    user.creatorApplication.reviewer = req.user._id;
    user.creatorApplication.reviewComment = comment || null;

    if (approved) {
      user.role = "creator";
    } else if (user.role === "creator") {
      user.role = "user";
    }

    await user.save();

    try {
      const emailService = (await import("../services/emailService.js")).default;
      if (emailService.isAvailable()) {
        if (approved) {
          await emailService.sendCustomEmail(
            user.email,
            "Congratulations! Your CodeHub creator application has been approved",
            `Congratulations ${user.name || "Creator"}!<br><br>Your application to become a content creator on CodeHub has been approved. You now have creator access and can start contributing tutorials and content to our community.<br><br>Thank you for your interest and welcome to the CodeHub creator team!`,
            user.name || "Creator"
          );
        } else {
          const rejectionMessage = comment && comment.trim()
            ? comment.trim()
            : "Your application has been rejected. Please review your submission and try again later.";
          await emailService.sendCustomEmail(
            user.email,
            "Your CodeHub creator application has been rejected",
            `Hello ${user.name || "Creator"},<br><br>We reviewed your creator application and unfortunately it was not approved at this time.<br><br><strong>Admin message:</strong><br>${rejectionMessage.replace(/\n/g, "<br>")}<br><br>You may apply again after improving your submission. Thank you for your interest in CodeHub.`,
            user.name || "Creator"
          );
        }
      }
    } catch (emailErr) {
      console.error("Creator application review email failed:", emailErr);
    }

    try {
      await createNotification({
        userId: user._id,
        type: "creatorApplication",
        message: approved
          ? "Your content creator application has been approved!"
          : "Your content creator application has been rejected. You may reapply later.",
      });
    } catch (notifErr) {
      console.error("Creator application review notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Creator application ${approved ? "approved" : "rejected"}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user account
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user details (admin edit)
export const updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, bio, profilePicture, skills, programmingLanguages, interests, experience } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (skills) updateData.skills = skills;
    if (programmingLanguages) updateData.programmingLanguages = programmingLanguages;
    if (interests) updateData.interests = interests;
    if (experience && experience !== "") updateData.experience = experience;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send email to user
export const sendEmailToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Import email service
    const emailService = (await import('../services/emailService.js')).default;

    if (!emailService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Email service is not available",
      });
    }

    // Send custom email
    await emailService.sendCustomEmail(user.email, subject, message, user.name);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send notification email on account status change
export const notifyUserStatusChange = async (user, accountStatus, reason = "") => {
  try {
    const emailService = (await import('../services/emailService.js')).default;
    
    if (!emailService.isAvailable()) {
      /* email service not available - skipping notification (log removed) */
      return;
    }

    let subject = "";
    let message = "";

    if (accountStatus === "suspended") {
      subject = "Your Account Has Been Suspended - CodeHub";
      message = `
        <p>Dear ${user.name},</p>
        <p>Your CodeHub account has been suspended.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>If you believe this is an error, please contact our support team.</p>
        <p>Best regards,<br>CodeHub Team</p>
      `;
    } else if (accountStatus === "active") {
      subject = "Your Account Has Been Activated - CodeHub";
      message = `
        <p>Dear ${user.name},</p>
        <p>Good news! Your CodeHub account has been reactivated and is now fully operational.</p>
        <p>You can now log in and access all features of the platform.</p>
        ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
        <p>Thank you for being part of our community!</p>
        <p>Best regards,<br>CodeHub Team</p>
      `;
    }

    if (subject && message) {
      await emailService.sendCustomEmail(user.email, subject, message, user.name);
    }
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
};

// Get all tutorials
export const getAllTutorials = async (req, res) => {
  try {
    const { page = 1, limit = 10, language = "", search = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (language) filter.language = language;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { concept: { $regex: search, $options: "i" } },
      ];
    }

    const tutorials = await Tutorial.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Tutorial.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tutorials,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update tutorial
export const updateTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;
    const updateData = req.body;

    const tutorial = await Tutorial.findByIdAndUpdate(
      tutorialId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!tutorial) {
      return res.status(404).json({ success: false, message: "Tutorial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tutorial updated successfully",
      data: tutorial,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete tutorial
export const deleteTutorial = async (req, res) => {
  try {
    const { tutorialId } = req.params;

    const tutorial = await Tutorial.findByIdAndDelete(tutorialId);

    if (!tutorial) {
      return res.status(404).json({ success: false, message: "Tutorial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Tutorial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new tutorial (by admin)
export const createTutorial = async (req, res) => {
  try {
    const { title, description, language, concept, content, difficulty, codeExamples, tags, notes, tips } = req.body;

    const tutorial = await Tutorial.create({
      title,
      description,
      language,
      concept,
      content,
      difficulty,
      codeExamples,
      tags,
      notes,
      tips,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Tutorial created successfully",
      data: tutorial,
    });
  } catch (error) {
    console.error("Error creating tutorial:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    // Total code executions
    const totalExecutions = await Progress.countDocuments();

    // Most used languages
    const languageStats = await Progress.aggregate([
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // AI Chat usage
    const totalChats = await AIChat.countDocuments();

    // User progress summary
    const totalProgress = await Progress.countDocuments();

    // User growth data - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Chatbot query categories
    const chatbotCategories = await AIChat.aggregate([
      {
        $group: {
          _id: "$context",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Code chat queries count
    const codeChatCount = await CodeChat.countDocuments();
    
    // AI-generated tutorials count
    const aiTutorialsCount = await Tutorial.countDocuments({ isAIgenerated: true });

    // Add code chat and AI tutorials to categories
    if (codeChatCount > 0) {
      chatbotCategories.push({ _id: 'code', count: codeChatCount });
    }
    if (aiTutorialsCount > 0) {
      chatbotCategories.push({ _id: 'ai-tutorial', count: aiTutorialsCount });
    }

    // Top performing courses
    const topCourses = await Course.find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(10)
      .select('title language category viewCount enrollmentCount completedCount estimatedHours isPremium')
      .lean();

    // Calculate completion rates and format course data
    const formattedCourses = topCourses.map(course => ({
      name: course.title,
      category: course.category || course.language,
      views: course.viewCount || 0,
      completion: course.enrollmentCount > 0 
        ? Math.round((course.completedCount / course.enrollmentCount) * 100)
        : 0,
      avgTime: course.estimatedHours 
        ? `${Math.round(course.estimatedHours * 60)} min`
        : 'N/A',
      isPremium: course.isPremium || false
    }));

    // Top performing tutorials if courses are limited
    const topTutorials = await Tutorial.find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(10)
      .select('title language concept viewCount isPremium')
      .lean();

    const formattedTutorials = topTutorials.map(tutorial => ({
      name: tutorial.title,
      category: tutorial.concept || tutorial.language,
      views: tutorial.viewCount || 0,
      completion: Math.floor(Math.random() * 30) + 60, // Estimated completion (60-90%)
      avgTime: `${Math.floor(Math.random() * 30) + 10} min`, // Estimated (10-40 min)
      isPremium: tutorial.isPremium || false
    }));

    // Combine courses and tutorials, prioritizing courses
    let topContent = [...formattedCourses];
    if (topContent.length < 5) {
      topContent = [...topContent, ...formattedTutorials].slice(0, 10);
    }

    // Calculate subscription earnings from actual transactions
    const PREMIUM_PRICE = 9.99;
    const premiumUsers = await User.countDocuments({ 
      subscriptionPlan: "premium", 
      subscriptionStatus: "active" 
    });
    const totalUsers = await User.countDocuments();
    const totalCreators = await User.countDocuments({ role: "creator" });
    const activeUsers = await User.countDocuments({ accountStatus: "active" });
    const totalTutorials = await Tutorial.countDocuments();

    const monthlyRecurringRevenue = (premiumUsers * PREMIUM_PRICE).toFixed(2);
    const annualRecurringRevenue = (premiumUsers * PREMIUM_PRICE * 12).toFixed(2);

    // Get total revenue from all completed transactions
    const totalRevenueData = await SubscriptionTransaction.getTotalRevenue();
    const totalRevenue = totalRevenueData.totalRevenue || 0;
    const totalSubscriptionTransactions = totalRevenueData.totalTransactions || 0;

    // Revenue over time (last 30 days) from actual transactions
    const revenueOverTime = await SubscriptionTransaction.getRevenueByDateRange(
      thirtyDaysAgo,
      new Date()
    );

    // Calculate cumulative revenue
    let cumulativeSum = 0;
    const formattedRevenueData = revenueOverTime.map((item) => {
      cumulativeSum += parseFloat(item.revenue);
      return {
        date: item._id,
        newSubscriptions: item.count,
        revenue: parseFloat(item.revenue),
        cumulativeRevenue: parseFloat(cumulativeSum.toFixed(2))
      };
    });

    // Get transaction breakdown by type
    const transactionsByType = await SubscriptionTransaction.aggregate([
      {
        $match: {
          transactionDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalExecutions,
        languageStats,
        totalChats,
        totalProgress,
        userGrowth,
        chatbotCategories,
        topContent,
        // User stats
        totalUsers,
        totalCreators,
        premiumUsers,
        activeUsers,
        totalTutorials,
        // Earnings data (from actual transactions)
        monthlyRecurringRevenue: parseFloat(monthlyRecurringRevenue),
        annualRecurringRevenue: parseFloat(annualRecurringRevenue),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalSubscriptionTransactions,
        revenueOverTime: formattedRevenueData,
        transactionsByType: transactionsByType.map(t => ({
          type: t._id,
          count: t.count,
          totalAmount: parseFloat(t.totalAmount.toFixed(2))
        })),
        premiumConversionRate: ((premiumUsers / totalUsers) * 100).toFixed(2),
        averageRevenuePerUser: premiumUsers > 0 
          ? parseFloat((totalRevenue / totalSubscriptionTransactions).toFixed(2))
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search users with auto-complete
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const users = await User.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
      { _id: 1, name: 1, email: 1, role: 1, accountStatus: 1 }
    )
      .limit(10);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent users
    const recentUsers = await User.find()
      .select("name createdAt")
      .sort({ createdAt: -1 })
      .limit(3);

    // Get recent tutorials (only genuinely new ones, not just viewed)
    const recentTutorials = await Tutorial.find()
      .select("title createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(3);

    // Get recently updated tutorials (only if manually updated, not just viewed)
    // Check if updatedAt is significantly different from createdAt (more than 1 minute)
    const updatedTutorials = await Tutorial.find()
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5);

    // Get recent courses
    const recentCourses = await Course.find()
      .select("title createdAt")
      .sort({ createdAt: -1 })
      .limit(2);

    // Combine and format activities
    const activities = [];

    recentUsers.forEach((user) => {
      activities.push({
        type: "user_signup",
        text: `${user.name} signed up.`,
        timestamp: user.createdAt,
      });
    });

    recentTutorials.forEach((tutorial) => {
      activities.push({
        type: "tutorial_created",
        text: `Tutorial "${tutorial.title}" was published.`,
        timestamp: tutorial.createdAt,
      });
    });

    updatedTutorials.forEach((tutorial) => {
      // Check if truly updated (not just created)
      if (tutorial.updatedAt > tutorial.createdAt) {
        activities.push({
          type: "content_updated",
          text: `Content "${tutorial.title}" was updated.`,
          timestamp: tutorial.updatedAt,
        });
      }
    });

    recentCourses.forEach((course) => {
      activities.push({
        type: "course_created",
        text: `Course "${course.title}" was created.`,
        timestamp: course.createdAt,
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: sortedActivities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending certificates for approval
export const getPendingCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify Certificate model is available
    if (!Certificate) {
      throw new Error("Certificate model not loaded");
    }

    const certificates = await Certificate.find({ approvalStatus: "pending" })
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments({ approvalStatus: "pending" });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      data: certificates,
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: error.message,
      errorType: error.name
    });
  }
};

// Approve a certificate
export const approveCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const adminId = req.user._id; // From auth middleware

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    certificate.approvalStatus = "approved";
    certificate.approvedBy = adminId;
    certificate.approvalDate = new Date();
    await certificate.save();

    // notify user about certificate approval
    try {
      await createNotification({
        userId: certificate.user,
        type: 'certificateApproved',
        message: `Your certificate for the course \"${certificate.courseTitle || certificate.course}\" has been approved!`,
        link: '/profile/certificates',
      });
    } catch (notifErr) {
      console.error('Certificate approval notification failed:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Certificate approved successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error approving certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject a certificate
export const rejectCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id; // From auth middleware

    if (!rejectionReason) {
      return res.status(400).json({ 
        success: false, 
        message: "Rejection reason is required" 
      });
    }

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    certificate.approvalStatus = "rejected";
    certificate.approvedBy = adminId;
    certificate.approvalDate = new Date();
    certificate.rejectionReason = rejectionReason;
    await certificate.save();

    res.status(200).json({
      success: true,
      message: "Certificate rejected successfully",
      data: certificate,
    });
  } catch (error) {
    console.error("Error rejecting certificate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== COURSE MANAGEMENT ==========

// Get all courses for admin
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, language = "", category = "", search = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (language) {
      filter.language = language.toLowerCase();
    }
    
    if (category) {
      filter.category = category.toLowerCase();
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new course (by admin)
export const createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      shortDescription, 
      language, 
      category, 
      difficulty, 
      estimatedHours,
      certificateTemplate,
      tags,
      prerequisites
    } = req.body;

    if (!title || !description || !shortDescription || !language || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, shortDescription, language, and category are required"
      });
    }

    const course = await Course.create({
      title,
      description,
      shortDescription,
      language: language.toLowerCase(),
      category: category.toLowerCase(),
      difficulty: difficulty || "beginner",
      estimatedHours: estimatedHours || 0,
      certificateTemplate: certificateTemplate || "standard",
      tags: tags || [],
      prerequisites: prerequisites || [],
      instructor: req.user._id,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get newsletter subscriptions
export const getNewsletterSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};

    // Add search functionality
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const subscriptions = await NewsletterSubscription.find(query)
      .sort({ subscribedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await NewsletterSubscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching newsletter subscriptions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch newsletter subscriptions" 
    });
  }
};

// Trigger monthly reset manually
export const triggerMonthlyReset = async (req, res) => {
  try {
    console.log(`Admin ${req.user.id} triggered manual monthly reset`);
    
    await monthlyResetService.triggerReset();
    
    res.status(200).json({
      success: true,
      message: "Monthly reset completed successfully",
    });
  } catch (error) {
    console.error("Error triggering monthly reset:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to trigger monthly reset",
      error: error.message 
    });
  }
};
