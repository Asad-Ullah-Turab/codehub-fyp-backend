import Quiz from "../models/Quiz.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import { createNotification } from "./notificationController.js";

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

// ========== QUIZ SUBMISSION ==========

// Submit quiz answers
export const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId, courseId, sectionId, answers } = req.body;
    const userId = req.user._id;

    // Validate quiz and get it with full details
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const resolvedCourseId =
      courseId ||
      quiz.course ||
      (quiz.section
        ? await Course.findOne({ "sections._id": quiz.section }).then(
            (course) => course?._id,
          )
        : null) ||
      (await Course.findOne({ "sections.sectionQuiz": quiz._id }).then(
        (course) => course?._id,
      ));

    // Determine bypass: admins and course instructors can take quizzes without enrollment
    let isBypass = req.user.role === "admin";
    if (!isBypass && req.user.role === "creator") {
      if (resolvedCourseId) {
        const quizCourse = await Course.findById(resolvedCourseId).select("instructor");
        if (quizCourse && quizCourse.instructor.toString() === userId.toString()) {
          isBypass = true;
        }
      } else {
        const ownedCourse = await Course.findOne({
          instructor: userId,
          $or: [
            { "sections.sectionQuiz": quiz._id },
            ...(quiz.section ? [{ "sections._id": quiz.section }] : []),
          ],
        }).select("_id");
        if (ownedCourse) isBypass = true;
      }
    }

    // Get enrollment
    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: resolvedCourseId,
    });

    if (!enrollment && !isBypass) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];

    for (const question of quiz.questions) {
      const userAnswer = answers[question._id.toString()];
      totalPoints += question.points;

      let isCorrect = false;
      let explanation = question.explanation;

      switch (question.type) {
        case "multiple-choice":
          const correctOption = question.options.find((opt) => opt.isCorrect);
          isCorrect = userAnswer === correctOption.text;
          break;

        case "true-false":
          const correctTFOption = question.options.find((opt) => opt.isCorrect);
          isCorrect = userAnswer === correctTFOption.text;
          break;

        case "short-answer":
          const acceptedAnswers = question.caseSensitive
            ? question.acceptableAnswers
            : question.acceptableAnswers.map((a) => a.toLowerCase());
          const normalizedAnswer = question.caseSensitive
            ? userAnswer
            : userAnswer?.toLowerCase();
          isCorrect = acceptedAnswers.includes(normalizedAnswer);
          break;

        case "coding":
          // In a real scenario, this would execute the code and test against test cases
          // For now, we'll mark it as pending review
          isCorrect = false; // TODO: Implement code execution
          explanation = "Coding answer submitted for review by instructor";
          break;
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      results.push({
        questionId: question._id,
        question: question.question,
        userAnswer,
        isCorrect,
        explanation,
        points: question.points,
      });
    }

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = scorePercentage >= quiz.passingScore;

    // Bypass users (admin / course instructor) get score feedback without enrollment tracking
    if (isBypass) {
      return res.status(200).json({
        success: true,
        message: "Quiz preview completed (no progress saved)",
        data: {
          enrollmentId: null,
          score: scorePercentage,
          maxScore: 100,
          passed,
          attemptCount: 1,
          results,
          certificate: null,
        },
      });
    }

    // Declare sectionProgress outside the if block
    let sectionProgress = null;

    // Update enrollment based on quiz type
    if (quiz.type === "section-quiz" && sectionId) {
      sectionProgress = enrollment.sectionProgress.find(
        (sp) => sp.section.toString() === sectionId,
      );

      if (!sectionProgress) {
        sectionProgress = { section: sectionId, lessons: [] };
        enrollment.sectionProgress.push(sectionProgress);
      }

      if (!sectionProgress.sectionQuizScore) {
        sectionProgress.sectionQuizScore = {};
      }

      sectionProgress.sectionQuizScore = {
        quizId,
        score: scorePercentage,
        maxScore: 100,
        attemptCount: (sectionProgress.sectionQuizScore.attemptCount || 0) + 1,
        lastAttemptAt: new Date(),
        passed,
      };

      if (passed) {
        sectionProgress.isCompleted = true;
        sectionProgress.completedAt = new Date();
      }
    }

    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    // Recalculate overall progress and check if all sections are completed
    try {
      const course = await Course.findById(resolvedCourseId).populate("sections");

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      enrollment.overallProgress = calculateOverallProgress(course, enrollment);
      const sections = course.sections || [];

      const allSectionsCompleted =
        sections.length > 0 &&
        sections.every((section) => {
          const sectionProgress = enrollment.sectionProgress.find(
            (sp) => sp.section.toString() === section._id.toString(),
          );

          const allLessonsCompleted =
            Array.isArray(section.lessons) &&
            section.lessons.length > 0 &&
            section.lessons.every((lesson) =>
              sectionProgress?.lessons?.some(
                (lp) => lp.lesson.toString() === lesson._id.toString() && lp.isCompleted,
              ),
            );

          const quizPassed = section.sectionQuiz
            ? Boolean(sectionProgress?.sectionQuizScore?.passed)
            : true;

          return allLessonsCompleted && quizPassed;
        });

      // Check if all sections are completed - if so, issue certificate
      if (allSectionsCompleted && !enrollment.certificateIssued) {
        enrollment.status = "completed";
        enrollment.completionDate = new Date();
        enrollment.certificateIssued = true;

        // Generate certificate
        const certificate = await generateCertificate(
          userId,
          resolvedCourseId,
          enrollment._id,
          scorePercentage,
        );

        enrollment.certificate = certificate._id;

        // notify user about course completion
        try {
          await createNotification({
            userId,
            type: "courseCompletion",
            message: `Congratulations! You completed the course \"${course.title}\".`,
            link: `/courses/${course._id}`,
          });
        } catch (notifErr) {
          console.error("Completion notification failed:", notifErr);
        }
      }

      await enrollment.save();
    } catch (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        enrollmentId: enrollment._id,
        score: scorePercentage,
        maxScore: 100,
        passed,
        attemptCount: sectionProgress?.sectionQuizScore?.attemptCount || 1,
        results,
        certificate: enrollment.certificate ? enrollment.certificate : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting quiz",
      error: error.message,
    });
  }
};

// Get quiz details with results for user
export const getQuizDetails = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Resolve course for the quiz. Section quizzes may not have course populated.
    let quizCourseId = quiz.course;
    if (!quizCourseId && quiz.section) {
      const containingCourse = await Course.findOne({
        "sections._id": quiz.section,
      });
      if (containingCourse) {
        quizCourseId = containingCourse._id;
      }
    }

    if (!quizCourseId) {
      const courseByQuiz = await Course.findOne({ "sections.sectionQuiz": quiz._id });
      if (courseByQuiz) {
        quizCourseId = courseByQuiz._id;
      }
    }

    // Determine bypass: admins and course instructors can view quizzes without enrollment
    let isBypass = req.user.role === "admin";
    if (!isBypass && req.user.role === "creator") {
      if (quizCourseId) {
        const quizCourse = await Course.findById(quizCourseId).select("instructor");
        if (quizCourse && quizCourse.instructor.toString() === userId.toString()) {
          isBypass = true;
        }
      } else {
        // quizCourseId couldn't be resolved — check if creator owns any course containing this quiz
        const ownedCourse = await Course.findOne({
          instructor: userId,
          $or: [
            { "sections.sectionQuiz": quiz._id },
            ...(quiz.section ? [{ "sections._id": quiz.section }] : []),
          ],
        }).select("_id");
        if (ownedCourse) isBypass = true;
      }
    }

    const enrollment = await CourseEnrollment.findOne({
      user: userId,
      course: quizCourseId,
    });

    if (!enrollment && !isBypass) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in the course to take this quiz",
      });
    }

    // For bypass users skip retake limits; they are previewing the quiz
    let quizScore;
    if (!isBypass) {
      if (quiz.type === "section-quiz") {
        const sectionId =
          typeof quiz.section === "object" ? quiz.section._id : quiz.section;

        if (!sectionId) {
          return res.status(400).json({
            success: false,
            message: "Section quiz is missing its section reference",
          });
        }

        const sectionProgress = enrollment.sectionProgress.find(
          (sp) => sp.section.toString() === sectionId.toString(),
        );
        quizScore = sectionProgress?.sectionQuizScore;
      } else {
        quizScore = enrollment.finalQuizScore;
      }

      if (
        quizScore &&
        quizScore.attemptCount >= quiz.maxRetakes &&
        !quiz.retakeAllowed
      ) {
        return res.status(403).json({
          success: false,
          message: `Maximum retakes (${quiz.maxRetakes}) reached`,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        quiz,
        previousScore: quizScore,
        canRetake: isBypass ? true : quizScore?.attemptCount < quiz.maxRetakes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching quiz",
      error: error.message,
    });
  }
};

// Get quiz leaderboard
export const getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { limit = 10 } = req.query;

    const enrollments = await CourseEnrollment.find()
      .populate("user", "name profilePicture")
      .limit(parseInt(limit));

    const leaderboard = enrollments
      .map((enrollment) => {
        let score;
        const quiz = null;
        if (enrollment.finalQuizScore?.quizId?.toString() === quizId) {
          score = enrollment.finalQuizScore;
        } else {
          const sectionProgress = enrollment.sectionProgress.find(
            (sp) => sp.sectionQuizScore?.quizId?.toString() === quizId,
          );
          score = sectionProgress?.sectionQuizScore;
        }

        return score
          ? {
              user: enrollment.user,
              score: score.score,
              attemptCount: score.attemptCount,
              lastAttemptAt: score.lastAttemptAt,
            }
          : null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};

// ========== CERTIFICATE MANAGEMENT ==========

// Generate certificate for user (one per course)
const generateCertificate = async (
  userId,
  courseId,
  enrollmentId,
  finalScore,
) => {
  try {
    // Check if certificate already exists for this user and course
    const existingCertificate = await Certificate.findOne({
      user: userId,
      course: courseId,
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${userId.toString().slice(-6)}`;

    const certificate = new Certificate({
      user: userId,
      course: courseId,
      enrollment: enrollmentId,
      certificateNumber,
      finalScore,
      template: "standard",
      isValid: true,
      approvalStatus: "pending",
    });

    const savedCertificate = await certificate.save();
    return savedCertificate;
  } catch (error) {
    throw error;
  }
};

// Get user's certificates
export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ user: userId })
      .populate("course", "title language category")
      .populate("user", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ issuedDate: -1 });

    const total = await Certificate.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: certificates,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching certificates",
      error: error.message,
    });
  }
};

// Get specific certificate
export const getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findById(certificateId)
      .populate("course", "title language category")
      .populate("user", "name email")
      .populate("enrollment");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Check ownership
    if (certificate.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this certificate",
      });
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("========== ERROR in getCertificateById ==========");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching certificate",
      error: error.message,
    });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.query;

    const certificate = await Certificate.findOne({
      certificateNumber,
      isValid: true,
    })
      .populate("course", "title language")
      .populate("user", "name");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found or invalid",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        courseName: certificate.course.title,
        userName: certificate.user.name,
        issuedDate: certificate.issuedDate,
        finalScore: certificate.finalScore,
        isValid: certificate.isValid,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying certificate",
      error: error.message,
    });
  }
};

export default {
  submitQuizAnswers,
  getQuizDetails,
  getQuizLeaderboard,
  getUserCertificates,
  getCertificateById,
  verifyCertificate,
};
