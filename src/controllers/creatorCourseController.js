import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import { createNotification } from "./notificationController.js";

const allowedCourseFields = [
  "title",
  "description",
  "shortDescription",
  "language",
  "category",
  "difficulty",
  "estimatedHours",
  "certificateTemplate",
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
