import User from "../models/User.js";
import Tutorial from "../models/Tutorial.js";
import AIChat from "../models/AIChat.js";
import Progress from "../models/Progress.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ accountStatus: "active" });
    const suspendedUsers = await User.countDocuments({ accountStatus: "suspended" });
    const totalTutorials = await Tutorial.countDocuments();
    const totalChats = await AIChat.countDocuments();

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        totalTutorials,
        totalChats,
        newUsersLast30Days,
        suspensionRate: ((suspendedUsers / totalUsers) * 100).toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "", status = "" } = req.query;
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

    const users = await User.find(filter)
      .select("-password")
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
    const { accountStatus } = req.body;

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
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
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

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
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

    res.status(200).json({
      success: true,
      data: {
        totalExecutions,
        languageStats,
        totalChats,
        totalProgress,
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
