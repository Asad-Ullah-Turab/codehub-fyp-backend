import User from "../models/User.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";
import { createNotification } from "./notificationController.js";
import fs from "fs";
import path from "path";

const calculateOverallProgress = (course, enrollment) => {
  const sections = course?.sections || [];
  const totalUnits = sections.reduce((sum, section) => {
    const lessonCount = Array.isArray(section.lessons) ? section.lessons.length : 0;
    return sum + lessonCount + (section.sectionQuiz ? 1 : 0);
  }, 0);

  if (totalUnits === 0) {
    return 0;
  }

  const completedUnits = sections.reduce((sum, section) => {
    const sectionProgress = enrollment?.sectionProgress?.find(
      (sp) => sp.section.toString() === section._id.toString(),
    );

    const completedLessons = sectionProgress?.lessons?.filter((lp) => lp.isCompleted).length || 0;
    const quizCompleted = sectionProgress?.sectionQuizScore?.passed ? 1 : 0;

    return sum + completedLessons + quizCompleted;
  }, 0);

  return Math.round((completedUnits / totalUnits) * 100);
};

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
    const {
      name,
      profilePicture,
      dateOfBirth,
      bio,
      location,
      github,
      linkedin,
      website,
      programmingLanguages,
      skills,
      interests,
      experience,
      preferences,
    } = req.body;

    const updateData = {};
    if (name !== undefined && name !== "") updateData.name = name;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;
    if (dateOfBirth !== undefined && dateOfBirth !== "")
      updateData.dateOfBirth = dateOfBirth;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (github !== undefined) updateData.github = github;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (website !== undefined) updateData.website = website;
    if (programmingLanguages !== undefined)
      updateData.programmingLanguages = programmingLanguages;
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    // Only set experience if it has a valid value (not empty string)
    if (experience !== undefined && experience !== "")
      updateData.experience = experience;
    if (preferences !== undefined) updateData.preferences = preferences;

    // First update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -emailVerificationOTP -passwordResetOTP");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if profile is complete with the updated data
    const isComplete = !!(
      updatedUser.name &&
      updatedUser.profilePicture &&
      updatedUser.dateOfBirth &&
      updatedUser.bio &&
      updatedUser.programmingLanguages?.length > 0 &&
      updatedUser.skills?.length > 0
    );

    // Update isProfileComplete if it changed
    if (updatedUser.isProfileComplete !== isComplete) {
      updatedUser.isProfileComplete = isComplete;
      await updatedUser.save();
    }

    // notify user of profile update
    try {
      await createNotification({
        userId,
        type: "profileUpdate",
        message: "Your profile has been updated.",
      });
    } catch (notifErr) {
      console.error("Profile update notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Mark profile completion prompt as shown
export const markPromptShown = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { profileCompletionPromptShown: true },
      { new: true },
    ).select("-password -emailVerificationOTP -passwordResetOTP");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating prompt status",
      error: error.message,
    });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Delete old profile picture if it exists and is a local file
    const user = await User.findById(userId);
    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const oldFilePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Generate the URL for the uploaded file
    const fileUrl = `/uploads/profile-pictures/${req.file.filename}`;

    // Update user's profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: fileUrl },
      { new: true },
    ).select("-password -emailVerificationOTP -passwordResetOTP");

    // notify user picture updated
    try {
      await createNotification({
        userId,
        type: "profilePicture",
        message: "Your profile picture has been updated.",
      });
    } catch (notifErr) {
      console.error("Profile picture notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        user: updatedUser,
        fileUrl: fileUrl,
      },
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error uploading profile picture",
      error: error.message,
    });
  }
};

// Submit creator application
export const submitCreatorApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "creator") {
      return res.status(400).json({
        success: false,
        message: "You are already a content creator",
      });
    }

    const { message, portfolioLink, experienceSummary } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a brief explanation for your creator application.",
      });
    }

    if (user.creatorApplication?.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your creator application is already pending review",
      });
    }

    user.creatorApplication = {
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewer: null,
      reviewComment: null,
      details: {
        message: message.trim(),
        portfolioLink: portfolioLink ? String(portfolioLink).trim() : null,
        experienceSummary: experienceSummary
          ? String(experienceSummary).trim()
          : null,
      },
    };

    await user.save();

    try {
      await createNotification({
        userId,
        type: "creatorApplication",
        message:
          "Your content creator application has been submitted and is pending review.",
      });
    } catch (notifErr) {
      console.error("Creator application notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: "Creator application submitted successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting creator application",
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
        select:
          "title description language difficulty instructor duration sections",
        populate: [
          { path: "instructor", select: "name profilePicture" },
          { path: "sections", select: "title lessons order" },
        ],
      })
      .sort({ enrolledAt: -1 });

    const activeEnrollments = enrollments.filter((enrollment) => enrollment.course);

    // Calculate progress for each course
    const coursesWithProgress = activeEnrollments.map((enrollment) => {
      const course = enrollment.course;
      const totalSections = course?.sections ? course.sections.length : 0;
      const completedSections = enrollment.sectionProgress
        ? enrollment.sectionProgress.filter((sp) => sp.isCompleted).length
        : 0;
      const progressPercentage = calculateOverallProgress(course, enrollment);

      return {
        enrollmentId: enrollment._id,
        course: course || null,
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

    // Import UserSavedTutorial dynamically to avoid circular dependencies
    const UserSavedTutorial = (await import("../models/UserSavedTutorial.js"))
      .default;

    // Get counts
    const [certificates, savedTutorialsCount] = await Promise.all([
      Certificate.countDocuments({ user: userId }),
      UserSavedTutorial.countDocuments({ userId: userId }),
    ]);

    // Get course completion stats
    const courseEnrollments = await CourseEnrollment.find({
      user: userId,
    }).populate("course", "sections");

    const activeCourseEnrollments = courseEnrollments.filter(
      (enrollment) => enrollment.course,
    );

    const enrolledCoursesCount = activeCourseEnrollments.length;

    let totalCourseProgress = 0;
    let completedCourses = 0;

    activeCourseEnrollments.forEach((enrollment) => {
      const courseProgress = calculateOverallProgress(enrollment.course, enrollment);
      totalCourseProgress += courseProgress;

      if (courseProgress === 100) {
        completedCourses++;
      }
    });

    const averageCourseProgress =
      enrolledCoursesCount > 0
        ? Math.round(totalCourseProgress / enrolledCoursesCount)
        : 0;

    // Calculate total time spent (from course enrollments)
    const totalTimeSpent = activeCourseEnrollments.reduce(
      (sum, enrollment) => sum + (enrollment.totalTimeSpentMinutes || 0),
      0,
    );

    const stats = {
      enrolledCourses: enrolledCoursesCount,
      completedCourses,
      certificates,
      averageCourseProgress,
      totalTimeSpentMinutes: totalTimeSpent,
      savedTutorials: savedTutorialsCount,
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

    const enrollments = await CourseEnrollment.find(filter)
      .populate({
        path: "course",
        select:
          "title description language difficulty instructor duration price thumbnail",
        populate: { path: "instructor", select: "name profilePicture" },
      })
      .sort({ enrolledAt: -1 });

    const activeEnrollments = enrollments
      .filter((enrollment) => enrollment.course)
      .sort((a, b) => b.enrolledAt - a.enrolledAt);

    const total = activeEnrollments.length;
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;
    const paginatedEnrollments = activeEnrollments.slice(skip, skip + pageLimit);

    // Add progress calculation
    const enrollmentsWithProgress = paginatedEnrollments.map((enrollment) => {
      const course = enrollment.course;
      const sections = course?.sections || [];
      const completedSections = enrollment.sectionProgress
        ? enrollment.sectionProgress.filter((sp) => sp.isCompleted).length
        : 0;
      const progressPercentage = calculateOverallProgress(course, enrollment);

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
        pages: Math.ceil(total / pageLimit),
        currentPage: pageNumber,
        limit: pageLimit,
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
      { new: true },
    ).populate("course", "title");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully ${status === "withdrawn" ? "withdrew from" : "updated"} course`,
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

// ========== CERTIFICATE MANAGEMENT ==========

// Get user's certificates
export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const certificates = await Certificate.find({
      user: userId,
      approvalStatus: "approved",
    })
      .populate("course", "title language category")
      .populate("user", "name email")
      .sort({ approvalDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments({
      user: userId,
      approvalStatus: "approved",
    });

    res.status(200).json({
      success: true,
      data: certificates,
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching user certificates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificates",
      error: error.message,
    });
  }
};

// Download certificate as PDF
export const downloadCertificatePdf = async (req, res) => {
  try {
    const userId = req.user._id;
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({
      _id: certificateId,
      user: userId,
      approvalStatus: "approved",
    })
      .populate("user", "name email")
      .populate("course", "title certificateTemplate certificateSignerName certificateSignerTitle certificateSealLabel certificateFooterText")
      .populate("enrollment");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found or not approved",
      });
    }

    // Calculate average quiz score from enrollment
    let averageScore = 0;
    let quizzesAttempted = 0;

    if (certificate.enrollment) {
      const enrollment = certificate.enrollment;
      let totalScore = 0;
      let count = 0;

      // Check section quiz scores
      if (
        enrollment.sectionProgress &&
        Array.isArray(enrollment.sectionProgress)
      ) {
        enrollment.sectionProgress.forEach((section) => {
          if (section.sectionQuizScore && section.sectionQuizScore.score) {
            totalScore += section.sectionQuizScore.score;
            count++;
          }
        });
      }

      // Check final quiz score if exists
      if (enrollment.finalQuizScore && enrollment.finalQuizScore.score) {
        totalScore += enrollment.finalQuizScore.score;
        count++;
      }

      quizzesAttempted = count;
      averageScore =
        count > 0 ? Math.round(totalScore / count) : certificate.finalScore;
    }

    // Import HTML service
    const { default: CertificateHtmlService } =
      await import("../services/certificateHtmlService.js");

    // Generate HTML
    const htmlContent = CertificateHtmlService.generateCertificate({
      user: certificate.user,
      course: certificate.course,
      certificateNumber: certificate.certificateNumber,
      finalScore: certificate.finalScore,
      averageScore: averageScore,
      quizzesAttempted: quizzesAttempted,
      issuedDate: certificate.approvalDate,
      certificateSignerName: certificate.course.certificateSignerName,
      certificateSignerTitle: certificate.course.certificateSignerTitle,
      certificateSealLabel: certificate.course.certificateSealLabel,
      certificateFooterText: certificate.course.certificateFooterText,
    });

    // Send HTML
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Certificate_${certificate.certificateNumber}.html"`,
    );
    res.send(htmlContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating certificate PDF",
      error: error.message,
    });
  }
};
