import mongoose from "mongoose";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import Certificate from "../models/Certificate.js";
import CourseEnrollment from "../models/CourseEnrollment.js";

// ========== COURSE MANAGEMENT ==========

// Create new course (Admin/Instructor only)
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
      prerequisites,
      targetAudience,
      learningObjectives,
      outcomes,
      requirements,
      isPremium,
    } = req.body;

    // Validation
    if (!title || !description || !shortDescription || !language || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const prerequisiteIds = Array.isArray(prerequisites)
      ? prerequisites.filter(Boolean)
      : [];

    const invalidPrerequisites = prerequisiteIds.some(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidPrerequisites) {
      return res.status(400).json({
        success: false,
        message: "Prerequisites must be valid course IDs.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can create courses",
      });
    }

    const course = new Course({
      title,
      description,
      shortDescription,
      language: language.toLowerCase(),
      category: category.toLowerCase(),
      difficulty,
      instructor: req.user._id,
      estimatedHours,
      certificateTemplate,
      tags,
      prerequisites: prerequisiteIds,
      targetAudience,
      learningObjectives,
      outcomes,
      requirements,
      isPremium: !!isPremium,
      isPublished: false,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid course data",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating course",
      error: error.message,
    });
  }
};

// Update course
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

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this course",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "shortDescription",
      "difficulty",
      "estimatedHours",
      "certificateTemplate",
      "tags",
      "thumbnail",
      "isPremium",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field]) course[field] = updates[field];
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating course",
      error: error.message,
    });
  }
};

// Publish/Unpublish course
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

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    course.isPublished = !course.isPublished;
    course.status = course.isPublished ? "published" : "draft";
    course.publishRequestedAt = null;
    course.publishReviewComment = null;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.isPublished ? "published" : "unpublished"}`,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling course publication",
      error: error.message,
    });
  }
};

// Delete course
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

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete related data
    await Quiz.deleteMany({ course: id });
    await CourseEnrollment.deleteMany({ course: id });
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: error.message,
    });
  }
};

// ========== SECTION MANAGEMENT ==========

// Add section to course
export const addSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const order = course.sections.length + 1;

    const section = {
      title,
      description,
      order,
      lessons: [],
      estimatedHours: 0,
      isLocked: false,
      unlockCondition: null,
      sectionQuiz: null,
    };

    course.sections.push(section);
    course.totalSections = course.sections.length;
    await course.save();

    res.status(201).json({
      success: true,
      message: "Section added successfully",
      data: course.sections[course.sections.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding section",
      error: error.message,
    });
  }
};

// Update section
export const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { title, description } = req.body;

    const course = await Course.findOne({ "sections._id": sectionId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    if (title) section.title = title;
    if (description) section.description = description;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: section,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating section",
      error: error.message,
    });
  }
};

// Delete section
export const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    const course = await Course.findOne({ "sections._id": sectionId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const sectionQuizId = (() => {
      if (!section.sectionQuiz) return null;
      if (mongoose.Types.ObjectId.isValid(section.sectionQuiz)) {
        return section.sectionQuiz.toString();
      }
      if (
        typeof section.sectionQuiz === "object" &&
        section.sectionQuiz._id &&
        mongoose.Types.ObjectId.isValid(section.sectionQuiz._id)
      ) {
        return section.sectionQuiz._id.toString();
      }
      return null;
    })();

    if (sectionQuizId) {
      await Quiz.findByIdAndDelete(sectionQuizId);
    }

    course.sections = course.sections.filter(
      (sec) => sec._id.toString() !== sectionId,
    );

    course.totalSections = course.sections.length;
    course.totalLessons = course.sections.reduce(
      (sum, sec) => sum + (sec.lessons?.length || 0),
      0,
    );

    await course.save();

    res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting section",
      error: error.message,
    });
  }
};

// ========== LESSON MANAGEMENT ==========

// Add lesson to section
export const addLesson = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const {
      title,
      description,
      content,
      videoUrl,
      duration,
      difficulty,
      estimatedHours,
      codeExamples,
    } = req.body;

    const course = await Course.findOne({ "sections._id": sectionId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const order = section.lessons.length + 1;

    const lesson = {
      title,
      description,
      content,
      order,
      videoUrl,
      duration,
      difficulty,
      estimatedHours,
      codeExamples: codeExamples || [],
      notes: [],
      tips: [],
      resources: [],
    };

    section.lessons.push(lesson);
    course.totalLessons = course.sections.reduce(
      (count, sec) => count + (sec.lessons?.length || 0),
      0,
    );

    await course.save();

    res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      data: section.lessons[section.lessons.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding lesson",
      error: error.message,
    });
  }
};

// Update lesson
export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const updates = req.body;

    const course = await Course.findOne({ "sections.lessons._id": lessonId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.find((sec) => sec.lessons.id(lessonId));
    const lesson = section?.lessons.id(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const allowedUpdates = [
      "title",
      "description",
      "content",
      "videoUrl",
      "duration",
      "difficulty",
      "estimatedHours",
      "codeExamples",
      "notes",
      "tips",
      "resources",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) lesson[field] = updates[field];
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: lesson,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating lesson",
      error: error.message,
    });
  }
};

// Delete lesson
export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const course = await Course.findOne({ "sections.lessons._id": lessonId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.find((sec) => sec.lessons.id(lessonId));
    const lesson = section?.lessons.id(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    section.lessons = section.lessons.filter(
      (lessonItem) => lessonItem._id.toString() !== lessonId,
    );
    course.totalLessons = course.sections.reduce(
      (count, sec) => count + (sec.lessons?.length || 0),
      0,
    );

    await course.save();

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting lesson",
      error: error.message,
    });
  }
};

// Get lessons for a section
export const getSectionLessons = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const course = await Course.findOne({ "sections._id": sectionId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const section = course.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.status(200).json({
      success: true,
      data: section.lessons || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching lessons",
      error: error.message,
    });
  }
};

// ========== QUIZ MANAGEMENT ==========

// Create or update quiz
export const createOrUpdateQuiz = async (req, res) => {
  try {
    const {
      courseId,
      sectionId,
      type,
      title,
      description,
      questions,
      passingScore,
      timeLimit,
      maxRetakes,
    } = req.body;
    const { quizId } = req.params;

    let course;

    if (quizId) {
      // Update existing quiz - find course from existing quiz data
      const existingQuiz =
        await Quiz.findById(quizId).populate("course section");
      if (!existingQuiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      // Use course/section from existing quiz if not provided in body
      const targetCourseId =
        courseId || (existingQuiz.course ? existingQuiz.course._id : null);
      const targetSectionId =
        sectionId || (existingQuiz.section ? existingQuiz.section._id : null);

      if (targetSectionId) {
        const courseWithSection = await Course.findOne({
          "sections._id": targetSectionId,
        });
        if (courseWithSection) {
          course = courseWithSection;
        }
      } else if (targetCourseId) {
        course = await Course.findById(targetCourseId);
      }
    } else {
      // Create new quiz - find course from body parameters
      if (courseId) {
        course = await Course.findById(courseId);
      } else if (sectionId) {
        const courseWithSection = await Course.findOne({
          "sections._id": sectionId,
        });
        if (courseWithSection) {
          course = courseWithSection;
        }
      }
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let quiz;

    if (quizId) {
      // Update existing quiz
      quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }

      quiz.title = title !== undefined ? title : quiz.title;
      quiz.description =
        description !== undefined ? description : quiz.description;
      quiz.questions = questions !== undefined ? questions : quiz.questions;
      quiz.passingScore =
        passingScore !== undefined ? passingScore : quiz.passingScore;
      quiz.timeLimit = timeLimit !== undefined ? timeLimit : quiz.timeLimit;
      quiz.maxRetakes = maxRetakes !== undefined ? maxRetakes : quiz.maxRetakes;
    } else {
      // Create new quiz
      const quizCourseId = courseId || (course ? course._id : null);
      quiz = new Quiz({
        title,
        description,
        questions,
        type: type || "section-quiz",
        course: quizCourseId,
        section: sectionId,
        passingScore: passingScore || 70,
        timeLimit: timeLimit || 0,
        maxRetakes: maxRetakes || 3,
        isPublished: false,
      });
    }

    await quiz.save();

    // Link quiz to section or course
    if (sectionId && type !== "final-quiz") {
      const section = course.sections.id(sectionId);
      if (section) {
        section.sectionQuiz = quiz._id;
        await course.save();
      }
    } else if (courseId && type === "final-quiz") {
      course.finalQuiz = quiz._id;
      await course.save();
    }

    res.status(quizId ? 200 : 201).json({
      success: true,
      message: quizId
        ? "Quiz updated successfully"
        : "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error managing quiz",
      error: error.message,
    });
  }
};

// Get instructor's courses
export const getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    const filter = { instructor: userId };

    if (status === "published") filter.isPublished = true;
    if (status === "draft") filter.isPublished = false;

    const courses = await Course.find(filter)
      .populate("instructor", "name email role")
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

// Get course sections
export const getCourseSections = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check authorization
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const sections = course.sections || [];

    res.status(200).json({
      success: true,
      data: sections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching course sections",
      error: error.message,
    });
  }
};

// Get quiz details
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("course");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check authorization
    if (
      quiz.course &&
      quiz.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz",
      error: error.message,
    });
  }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("course");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check authorization
    if (
      quiz.course &&
      quiz.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Remove quiz reference from section or course
    if (quiz.section) {
      const quizSectionId =
        typeof quiz.section === "object" ? quiz.section._id : quiz.section;
      const course = await Course.findOne({ "sections._id": quizSectionId });
      if (course) {
        const section = course.sections.id(quizSectionId);
        if (section) {
          section.sectionQuiz = null;
          await course.save();
        }
      }
    } else if (quiz.course && quiz.type === "final-quiz") {
      await Course.findByIdAndUpdate(quiz.course._id, {
        $unset: { finalQuiz: 1 },
      });
    }

    await Quiz.findByIdAndDelete(quizId);

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting quiz",
      error: error.message,
    });
  }
};

export default {
  createCourse,
  updateCourse,
  togglePublishCourse,
  deleteCourse,
  addSection,
  updateSection,
  deleteSection,
  addLesson,
  updateLesson,
  deleteLesson,
  getSectionLessons,
  createOrUpdateQuiz,
  getInstructorCourses,
  getCourseSections,
  getQuiz,
  deleteQuiz,
};
