import mongoose from "mongoose";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import CourseReview from "../models/CourseReview.js";
import { createNotification } from "./notificationController.js";

// ========== PUBLIC ROUTES ==========

// Get all published courses with filters
export const getAllCourses = async (req, res) => {
  try {
    const { language, category, difficulty, page = 1, limit = 10 } = req.query;

    const filter = { isPublished: true, isArchived: false };

    if (language) filter.language = language.toLowerCase();
    if (category) filter.category = category.toLowerCase();
    if (difficulty) filter.difficulty = difficulty.toLowerCase();

    const skip = (page - 1) * limit;

    const courses = await Course.find(filter)
      .populate("instructor", "name email profilePicture role")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
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
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

// Get single course with all details
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("instructor", "name email profilePicture role")
      .populate("finalQuiz");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is enrolled (if authenticated)
    let enrollment = null;
    if (req.user) {
      enrollment = await CourseEnrollment.findOne({
        user: req.user._id,
        course: id,
      });
    }

    res.status(200).json({
      success: true,
      data: course,
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching course",
      error: error.message,
    });
  }
};

// Get course by language
export const getCoursesByLanguage = async (req, res) => {
  try {
    const { language } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const courses = await Course.find({
      language: language.toLowerCase(),
      isPublished: true,
      isArchived: false,
    })
      .populate("instructor", "name email profilePicture role")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments({
      language: language.toLowerCase(),
      isPublished: true,
      isArchived: false,
    });

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
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message,
    });
  }
};

// ========== ENROLLMENT ROUTES (Protected) ==========

// Enroll user in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // premium course enrollment requires premium user
    if (course.isPremium && !req.user.isPremium()) {
      return res.status(403).json({
        success: false,
        message: "Only premium users can enroll in this course",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Create enrollment
    const enrollment = new CourseEnrollment({
      user: userId,
      course: courseId,
      sectionProgress: [],
    });

    await enrollment.save();

    // Update course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    // Notification for enrollment
    try {
      await createNotification({
        userId,
        type: "enrollment",
        message: `You have been enrolled in the course "${course.title}".`,
        link: `/courses/${course._id}`,
      });
    } catch (notifErr) {
      console.error("Enrollment notification failed:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error enrolling in course",
      error: error.message,
    });
  }
};

// Get user's enrolled courses
export const getUserEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "active", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (status) filter.status = status;

    const enrollments = await CourseEnrollment.find(filter)
      .populate({
        path: "course",
        populate: "instructor",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ enrollmentDate: -1 });

    const total = await CourseEnrollment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
      error: error.message,
    });
  }
};

// Get course enrollment details for user
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    })
      .populate({
        path: "course",
        populate: "instructor",
      })
      .populate("certificate");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Calculate progress information
    const course = enrollment.course;
    let totalLessons = 0;
    let completedLessons = 0;

    for (const section of course.sections) {
      totalLessons += Array.isArray(section.lessons)
        ? section.lessons.length
        : 0;

      const userSectionProgress = enrollment.sectionProgress.find(
        (sp) => sp.section.toString() === section._id.toString(),
      );

      if (userSectionProgress) {
        completedLessons += userSectionProgress.lessons.filter(
          (lp) => lp.isCompleted,
        ).length;
      }
    }

    res.status(200).json({
      success: true,
      data: enrollment,
      progress: {
        completedLessons,
        totalLessons,
        overallProgress: enrollment.overallProgress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching enrollment details",
      error: error.message,
    });
  }
};

// Mark lesson as completed
export const completeLessonProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId, lessonId, timeSpentMinutes = 0 } = req.body;
    const userId = req.user._id;

    // First, check if enrollment exists
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Check if section progress exists
    const sectionExists = enrollment.sectionProgress.some(
      (sp) => sp.section.toString() === sectionId,
    );

    if (!sectionExists) {
      // Add new section progress with lesson
      await CourseEnrollment.updateOne(
        { user: userId, course: courseId },
        {
          $push: {
            sectionProgress: {
              section: sectionId,
              lessons: [
                {
                  lesson: lessonId,
                  isCompleted: true,
                  completedAt: new Date(),
                  timeSpentMinutes: timeSpentMinutes,
                },
              ],
              isCompleted: false,
              lastAccessedAt: new Date(),
              timeSpentMinutes: timeSpentMinutes,
            },
          },
          $set: {
            lastAccessedAt: new Date(),
          },
          $inc: {
            totalTimeSpentMinutes: timeSpentMinutes,
          },
        },
      );
    } else {
      // Check if lesson progress exists
      const sectionProgress = enrollment.sectionProgress.find(
        (sp) => sp.section.toString() === sectionId,
      );

      const lessonExists = sectionProgress.lessons.some(
        (lp) => lp.lesson.toString() === lessonId,
      );

      if (!lessonExists) {
        // Add new lesson progress
        await CourseEnrollment.updateOne(
          {
            user: userId,
            course: courseId,
            "sectionProgress.section": sectionId,
          },
          {
            $push: {
              "sectionProgress.$.lessons": {
                lesson: lessonId,
                isCompleted: true,
                completedAt: new Date(),
                timeSpentMinutes: timeSpentMinutes,
              },
            },
            $set: {
              "sectionProgress.$.lastAccessedAt": new Date(),
              lastAccessedAt: new Date(),
            },
            $inc: {
              "sectionProgress.$.timeSpentMinutes": timeSpentMinutes,
              totalTimeSpentMinutes: timeSpentMinutes,
            },
          },
        );
      } else {
        // Update existing lesson progress
        const existingLesson = sectionProgress.lessons.find(
          (lp) => lp.lesson.toString() === lessonId,
        );
        const previousTime = existingLesson.timeSpentMinutes || 0;
        const timeDifference = timeSpentMinutes - previousTime;

        await CourseEnrollment.updateOne(
          {
            user: userId,
            course: courseId,
            "sectionProgress.section": sectionId,
            "sectionProgress.lessons.lesson": lessonId,
          },
          {
            $set: {
              "sectionProgress.$[sp].lessons.$[lp].isCompleted": true,
              "sectionProgress.$[sp].lessons.$[lp].completedAt": new Date(),
              "sectionProgress.$[sp].lessons.$[lp].timeSpentMinutes":
                timeSpentMinutes,
              "sectionProgress.$[sp].lastAccessedAt": new Date(),
              lastAccessedAt: new Date(),
            },
            $inc: {
              "sectionProgress.$[sp].timeSpentMinutes": timeDifference,
              totalTimeSpentMinutes: timeDifference,
            },
          },
          {
            arrayFilters: [
              { "sp.section": sectionId },
              { "lp.lesson": lessonId },
            ],
          },
        );
      }
    }

    // Recalculate overall progress
    const updatedEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    const course = await Course.findById(courseId);
    let totalLessons = 0;
    let completedLessons = 0;

    for (const section of course.sections) {
      totalLessons += Array.isArray(section.lessons)
        ? section.lessons.length
        : 0;

      const userSectionProgress = updatedEnrollment.sectionProgress.find(
        (sp) => sp.section.toString() === section._id.toString(),
      );

      if (userSectionProgress) {
        completedLessons += userSectionProgress.lessons.filter(
          (lp) => lp.isCompleted,
        ).length;
      }
    }

    const overallProgress = Math.round((completedLessons / totalLessons) * 100);

    await CourseEnrollment.updateOne(
      { user: userId, course: courseId },
      { $set: { overallProgress } },
    );

    // Return updated enrollment
    const finalEnrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      data: finalEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating lesson progress",
      error: error.message,
    });
  }
};

// ========== REVIEW ROUTES ==========

// Add or update a review for a course
export const addCourseReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Check if user is enrolled in the course
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: courseId,
    });

    const isVerifiedEnrollment = !!enrollment;

    // Check if review already exists
    let review = await CourseReview.findOne({ course: courseId, user: userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || "";
      await review.save();
    } else {
      // Create new review
      review = new CourseReview({
        course: courseId,
        user: userId,
        rating,
        comment: comment || "",
        isVerifiedEnrollment,
      });
      await review.save();
    }

    // Populate user data
    await review.populate("user", "name profilePicture");

    // Recalculate course average rating
    const reviews = await CourseReview.find({ course: courseId });
    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
            1,
          )
        : 0;

    await Course.findByIdAndUpdate(courseId, {
      averageRating: parseFloat(averageRating),
      ratingCount: reviews.length,
    });

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error adding course review:", error);
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
};

// Get all reviews for a course
export const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sortBy = "recent" } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const skip = (page - 1) * limit;
    let sortOption = { createdAt: -1 }; // default: recent

    if (sortBy === "rating-high") {
      sortOption = { rating: -1 };
    } else if (sortBy === "rating-low") {
      sortOption = { rating: 1 };
    } else if (sortBy === "helpful") {
      sortOption = { helpful: -1 };
    }

    const reviews = await CourseReview.find({ course: courseId })
      .populate("user", "name profilePicture")
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await CourseReview.countDocuments({ course: courseId });

    const ratingDistributionData = await CourseReview.aggregate([
      { $match: { course: mongoose.Types.ObjectId.createFromHexString(courseId) } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistributionData.forEach((item) => {
      if (item?._id >= 1 && item._id <= 5) {
        ratingDistribution[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
        ratingDistribution,
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

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await CourseReview.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true },
    ).populate("user", "name profilePicture");

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Review marked as helpful",
      data: review,
    });
  } catch (error) {
    console.error("Error marking review helpful:", error);
    res.status(500).json({
      success: false,
      message: "Error updating review",
      error: error.message,
    });
  }
};

export default {
  getAllCourses,
  getCourseById,
  getCoursesByLanguage,
  enrollInCourse,
  getUserEnrolledCourses,
  getEnrollmentDetails,
  completeLessonProgress,
  addCourseReview,
  getCourseReviews,
  markReviewHelpful,
};
