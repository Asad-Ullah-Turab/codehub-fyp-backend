import User from "../models/User.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";

// ========== PROFILE MANAGEMENT ==========

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("-password -emailVerificationOTP -passwordResetOTP")
      .populate("certificates")
      .populate("progress");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, profilePicture, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (preferences) updateData.preferences = { ...preferences };

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -emailVerificationOTP -passwordResetOTP");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// ========== PROGRESS TRACKING ==========

// Get user's course progress
export const getCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all enrollments with course details and progress
    const enrollments = await CourseEnrollment.find({ user: userId })
      .populate({
        path: "course",
        select: "title description language difficulty instructor duration sections",
        populate: [
          { path: "instructor", select: "name profilePicture" },
          { path: "sections", select: "title lessons order" }
        ]
      })
      .sort({ enrolledAt: -1 });

    // Calculate progress for each course
    const coursesWithProgress = enrollments.map(enrollment => {
      const course = enrollment.course;
      const totalSections = course.sections ? course.sections.length : 0;
      const completedSections = enrollment.sectionProgress ? enrollment.sectionProgress.filter(sp => sp.isCompleted).length : 0;
      
      const progressPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
      
      return {
        enrollmentId: enrollment._id,
        course: course,
        enrolledAt: enrollment.enrolledAt,
        progressPercentage,
        completedSections,
        totalSections,
        status: enrollment.status,
        lastAccessed: enrollment.lastAccessed,
        certificateEarned: enrollment.certificateEarned,
      };
    });

    res.status(200).json({
      success: true,
      data: coursesWithProgress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching course progress",
      error: error.message,
    });
  }
};

// Get user's tutorial progress
export const getTutorialProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const progress = await Progress.find({ user: userId })
      .populate("tutorial", "title description language difficulty concept")
      .sort({ lastAccessed: -1 });

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tutorial progress",
      error: error.message,
    });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts
    const [enrolledCoursesCount, completedTutorials, certificates, recentProgress] = await Promise.all([
      CourseEnrollment.countDocuments({ user: userId }),
      Progress.countDocuments({ user: userId, completionPercent: 100 }),
      Certificate.countDocuments({ user: userId }),
      Progress.find({ user: userId })
        .populate("tutorial", "title language")
        .sort({ lastAccessed: -1 })
        .limit(5)
    ]);

    // Get course completion stats
    const courseEnrollments = await CourseEnrollment.find({ user: userId })
      .populate("course", "sections");

    let totalCourseProgress = 0;
    let completedCourses = 0;

    courseEnrollments.forEach(enrollment => {
      const course = enrollment.course;
      const totalSections = course.sections ? course.sections.length : 0;
      const completedSections = enrollment.sectionProgress ? enrollment.sectionProgress.filter(sp => sp.isCompleted).length : 0;
      
      if (totalSections > 0) {
        const courseProgress = (completedSections / totalSections) * 100;
        totalCourseProgress += courseProgress;
        
        if (courseProgress === 100) {
          completedCourses++;
        }
      }
    });

    const averageCourseProgress = enrolledCoursesCount > 0 ? Math.round(totalCourseProgress / enrolledCoursesCount) : 0;

    // Calculate total time spent
    const totalTimeSpent = await Progress.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalTime: { $sum: "$timeSpentMinutes" } } }
    ]);

    const stats = {
      enrolledCourses: enrolledCoursesCount,
      completedCourses,
      completedTutorials,
      certificates,
      averageCourseProgress,
      totalTimeSpentMinutes: totalTimeSpent[0]?.totalTime || 0,
      recentActivity: recentProgress,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// ========== ENROLLMENT MANAGEMENT ==========

// Get user's enrollments with detailed info
export const getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const enrollments = await CourseEnrollment.find(filter)
      .populate({
        path: "course",
        select: "title description language difficulty instructor duration price thumbnail",
        populate: { path: "instructor", select: "name profilePicture" }
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ enrolledAt: -1 });

    const total = await CourseEnrollment.countDocuments(filter);

    // Add progress calculation
    const enrollmentsWithProgress = enrollments.map(enrollment => {
      const course = enrollment.course;
      const sections = course.sections || [];
      const completedSections = enrollment.sectionProgress ? enrollment.sectionProgress.filter(sp => sp.isCompleted).length : 0;
      const progressPercentage = sections.length > 0 ? Math.round((completedSections / sections.length) * 100) : 0;

      return {
        ...enrollment.toObject(),
        progressPercentage,
        completedSections,
        totalSections: sections.length,
      };
    });

    res.status(200).json({
      success: true,
      data: enrollmentsWithProgress,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrollments",
      error: error.message,
    });
  }
};

// Update enrollment status (withdraw from course)
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!["active", "paused", "withdrawn"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active', 'paused', or 'withdrawn'",
      });
    }

    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { _id: enrollmentId, user: userId },
      { status, lastAccessed: new Date() },
      { new: true }
    ).populate("course", "title");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${status === 'withdrawn' ? 'withdrew from' : 'updated'} course`,
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating enrollment status",
      error: error.message,
    });
  }
};