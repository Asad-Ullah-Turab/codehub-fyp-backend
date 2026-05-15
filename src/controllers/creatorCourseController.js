import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import { createNotification } from "./notificationController.js";
import CourseReview from "../models/CourseReview.js";
import geminiService from "../services/geminiService.js";
import User from "../models/User.js";

const allowedCourseFields = [
  "title",
  "description",
  "shortDescription",
  "language",
  "category",
  "difficulty",
  "estimatedHours",
  "certificateTemplate",
  "certificateSignerName",
  "certificateSignerTitle",
  "certificateSealLabel",
  "certificateFooterText",
  "tags",
  "prerequisites",
  "targetAudience",
  "learningObjectives",
  "outcomes",
  "requirements",
  "isPremium",
  "thumbnail",
];

export const createCourse = async (req, res) => {
  try {
    if (req.user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only creators can create courses",
      });
    }

    const courseCount = await Course.countDocuments({ instructor: req.user._id });
    const isPro = req.user.isCreatorPro && req.user.isCreatorPro();
    const FREE_COURSE_LIMIT = 5;
    if (!isPro && courseCount >= FREE_COURSE_LIMIT) {
      return res.status(403).json({
        success: false,
        message: `Free creators can only create ${FREE_COURSE_LIMIT} courses. Upgrade to Creator Pro for unlimited course uploads.`,
        code: "COURSE_LIMIT_REACHED",
      });
    }

    const {
      title,
      description,
      shortDescription,
      language,
      category,
      difficulty,
      estimatedHours,
      certificateTemplate,
      certificateSignerName,
      certificateSignerTitle,
      certificateSealLabel,
      certificateFooterText,
      tags,
      prerequisites,
      targetAudience,
      learningObjectives,
      outcomes,
      requirements,
      isPremium,
      thumbnail,
    } = req.body;

    if (!title || !description || !shortDescription || !language || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for course creation",
      });
    }

    const prerequisiteIds = Array.isArray(prerequisites)
      ? prerequisites.filter(
          (id) => typeof id === "string" && id.trim().length > 0,
        )
      : [];

    if (!Array.isArray(prerequisites) && prerequisites !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Prerequisites must be provided as an array.",
      });
    }

    const course = new Course({
      title,
      description,
      shortDescription,
      language: language.toLowerCase(),
      category: category.toLowerCase(),
      difficulty: difficulty || "beginner",
      instructor: req.user._id,
      estimatedHours: estimatedHours || 0,
      certificateTemplate: certificateTemplate || "standard",
      certificateSignerName: certificateSignerName || "",
      certificateSignerTitle: certificateSignerTitle || "",
      certificateSealLabel: certificateSealLabel || "Official Seal",
      certificateFooterText:
        certificateFooterText ||
        "Verified Achievement • Authenticated Completion • Excellence Recognized",
      tags: tags || [],
      prerequisites: prerequisiteIds,
      targetAudience: targetAudience || "",
      learningObjectives: learningObjectives || [],
      outcomes: outcomes || [],
      requirements: requirements || [],
      isPremium: !!isPremium,
      thumbnail: thumbnail || null,
      isPublished: false,
      status: "draft",
      publishRequestedAt: null,
      publishReviewComment: null,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error creating creator course:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating course",
    });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    const skip = (page - 1) * limit;

    const filter = { instructor: req.user._id };
    const allowedStatuses = [
      "draft",
      "pending",
      "published",
      "archived",
      "rejected",
    ];
    if (status && allowedStatuses.includes(String(status).toLowerCase())) {
      filter.status = String(status).toLowerCase();
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email role")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10));

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching creator courses:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching creator courses",
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this course",
      });
    }

    allowedCourseFields.forEach((field) => {
      if (updates[field] !== undefined) {
        course[field] = updates[field];
      }
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error updating creator course:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating course",
    });
  }
};

export const requestPublishCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to request publish for this course",
      });
    }

    if (course.hasAdminApprovedPublish) {
      return res.status(400).json({
        success: false,
        message:
          "This course has already been approved once. Use the publish toggle endpoint to publish or unpublish it directly.",
      });
    }

    if (course.status === "published") {
      return res.status(400).json({
        success: false,
        message: "Course is already published",
      });
    }

    if (course.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Course publish request is already pending review",
      });
    }

    course.status = "pending";
    course.isPublished = false;
    course.publishRequestedAt = new Date();
    course.publishReviewComment = null;
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course publish request submitted successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error requesting publish:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error requesting publish",
    });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to change publication status for this course",
      });
    }

    if (!course.hasAdminApprovedPublish) {
      return res.status(400).json({
        success: false,
        message:
          "Course must be approved by an admin once before the creator can publish or unpublish it directly.",
      });
    }

    if (course.status === "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot toggle publish status while a publish request is pending review",
      });
    }

    const isNowPublished = !course.isPublished;
    course.isPublished = isNowPublished;
    course.status = isNowPublished ? "published" : "draft";
    course.publishRequestedAt = null;
    course.publishReviewComment = null;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${isNowPublished ? "published" : "unpublished"} successfully`,
      data: course,
    });
  } catch (error) {
    console.error("Error toggling creator publish status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error toggling publish status",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this course",
      });
    }

    await Quiz.deleteMany({ course: id });
    await CourseEnrollment.deleteMany({ course: id });
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting creator course:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting course",
    });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate(
      "instructor",
      "name email role",
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const instructorId =
      course.instructor && typeof course.instructor === "object"
        ? course.instructor._id?.toString()
        : course.instructor?.toString();

    if (instructorId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching course",
      });
  }
};

export const getCourseEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const enrollments = await CourseEnrollment.find({ course: id })
      .populate("user", "name email")
      .sort({ enrollmentDate: -1 });

    res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching course enrollments",
      });
  }
};

export const getCourseRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.status(200).json({
      success: true,
      data: {
        averageRating: course.averageRating || 0,
        ratingCount: course.ratingCount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching course ratings:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching course ratings",
      });
  }
};

export const getPendingPublishRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: "pending" };

    const courses = await Course.find(filter)
      .populate("instructor", "name email role")
      .sort({ publishRequestedAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10));

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching pending publish requests:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching pending publish requests",
    });
  }
};

export const reviewPublishRequest = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    const { action, comment } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review action",
      });
    }

    const course = await Course.findById(id).populate(
      "instructor",
      "name email",
    );
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending publish requests may be reviewed",
      });
    }

    if (action === "approve") {
      course.status = "published";
      course.isPublished = true;
      course.publishRequestedAt = null;
      course.publishReviewComment = null;
      course.hasAdminApprovedPublish = true;
    } else {
      course.status = "rejected";
      course.isPublished = false;
      course.publishReviewComment = comment ? String(comment).trim() : null;
      course.publishRequestedAt = null;
    }

    await course.save();

    try {
      await createNotification({
        userId: course.instructor,
        type: "coursePublishReview",
        message:
          action === "approve"
            ? `Your course "${course.title}" has been approved and is now published.`
            : `Your course "${course.title}" was rejected for publication. ${comment || "Please update the content and resubmit."}`,
        link: `/courses/${course._id}`,
      });
    } catch (notifErr) {
      console.error("Publish review notification failed:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Course publish request ${action === "approve" ? "approved" : "rejected"}`,
      data: course,
    });
  } catch (error) {
    console.error("Error reviewing publish request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error reviewing publish request",
    });
  }
};

// Get all reviews for creator's courses
export const getCourseReviewsForCreator = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view reviews for your own courses",
      });
    }

    const skip = (page - 1) * limit;
    const reviews = await CourseReview.find({ course: courseId })
      .populate("user", "name email profilePicture")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await CourseReview.countDocuments({ course: courseId });

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const allReviews = await CourseReview.find({ course: courseId });
    allReviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
};

export const generateSectionWithAI = async (req, res) => {
  try {
    const isPro = req.user.isCreatorPro && req.user.isCreatorPro();

    // Resolve API key: Pro uses platform key, free tier uses their own key
    let apiKey = null;
    if (!isPro) {
      const userWithKey = await User.findById(req.user._id).select("+geminiApiKey");
      if (!userWithKey?.geminiApiKey) {
        return res.status(403).json({
          success: false,
          message: "AI section generation requires Creator Pro or your own Gemini API key. Add your key in Earnings settings.",
          code: "PRO_OR_KEY_REQUIRED",
        });
      }
      apiKey = userWithKey.geminiApiKey;
    }

    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: "Topic is required" });
    }

    const course = await Course.findOne({
      _id: req.params.courseId,
      instructor: req.user._id,
    });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const generated = await geminiService.generateCourseSection(
      topic.trim(),
      course.language || "javascript",
      course.difficulty || "beginner",
      apiKey,
    );

    res.status(200).json({ success: true, data: generated });
  } catch (error) {
    console.error("Error generating section with AI:", error);
    res.status(500).json({ success: false, message: error.message || "AI generation failed" });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findOne({ _id: courseId, instructor: req.user._id });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const isPro = req.user.isCreatorPro && req.user.isCreatorPro();

    // Basic stats available to all creators
    const totalEnrollments = await CourseEnrollment.countDocuments({ course: courseId });
    const completedEnrollments = await CourseEnrollment.countDocuments({ course: courseId, isCompleted: true });
    const completionRate = totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : "0.0";

    // Last 30 days enrollments
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEnrollments = await CourseEnrollment.countDocuments({
      course: courseId,
      enrollmentDate: { $gte: thirtyDaysAgo },
    });

    const basicStats = { totalEnrollments, completedEnrollments, completionRate: parseFloat(completionRate), recentEnrollments };

    if (!isPro) {
      return res.status(200).json({
        success: true,
        isPro: false,
        data: basicStats,
      });
    }

    // Pro-only: enrollment trend over last 30 days grouped by day
    const enrollmentTrend = await CourseEnrollment.aggregate([
      { $match: { course: course._id, enrollmentDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrollmentDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pro-only: review/rating stats
    const reviewStats = await CourseReview.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $gte: ["$rating", 3] }, 1, 0] } },
        },
      },
    ]);

    // Pro-only: payout earned for this course (approximate — based on creator payouts)
    const CreatorPayout = (await import("../models/CreatorPayout.js")).default;
    const payoutStats = await CreatorPayout.aggregate([
      { $match: { creator: req.user._id, status: "paid" } },
      { $group: { _id: null, totalEarned: { $sum: "$payoutAmount" }, payoutCount: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      isPro: true,
      data: {
        ...basicStats,
        enrollmentTrend,
        reviewStats: reviewStats[0] || { avgRating: 0, totalReviews: 0 },
        payoutStats: payoutStats[0] || { totalEarned: 0, payoutCount: 0 },
      },
    });
  } catch (error) {
    console.error("Error getting course analytics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get summary of all reviews for creator's courses
export const getCreatorReviewsSummary = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const courses = await Course.find({ instructor: creatorId })
      .select("title")
      .sort({ createdAt: -1 });
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: [],
          totalReviews: 0,
          averageRating: 0,
        },
      });
    }

    const reviews = await CourseReview.find({ course: { $in: courseIds } })
      .populate("course", "title")
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    const reviewsByCourseId = {};

    courses.forEach((course) => {
      reviewsByCourseId[course._id.toString()] = {
        courseId: course._id.toString(),
        courseTitle: course.title,
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
      };
    });

    reviews.forEach((review) => {
      const courseId = review.course._id.toString();
      if (!reviewsByCourseId[courseId]) {
        reviewsByCourseId[courseId] = {
          courseId,
          courseTitle: review.course.title,
          reviews: [],
          averageRating: 0,
          totalReviews: 0,
        };
      }
      reviewsByCourseId[courseId].reviews.push(review);
    });

    Object.keys(reviewsByCourseId).forEach((courseId) => {
      const courseReviews = reviewsByCourseId[courseId].reviews;
      reviewsByCourseId[courseId].totalReviews = courseReviews.length;
      reviewsByCourseId[courseId].averageRating =
        courseReviews.length > 0
          ? parseFloat(
              (
                courseReviews.reduce((sum, r) => sum + r.rating, 0) /
                courseReviews.length
              ).toFixed(1),
            )
          : 0;
    });

    const summary = Object.values(reviewsByCourseId);
    const totalReviews = reviews.length;
    const overallAverageRating =
      reviews.length > 0
        ? parseFloat(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            ).toFixed(1),
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary,
        totalReviews,
        averageRating: overallAverageRating,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews summary",
      error: error.message,
    });
  }
};
