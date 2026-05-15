import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

/**
 * Seed comprehensive courses with:
 * - Each course: 3 sections
 * - Each section: 3 lessons + 1 quiz
 * - 2 courses from admin + 3 courses from creators
 */
const seedCourses = async () => {
  try {
    // Clear existing data
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    console.log("Cleared existing courses and quizzes");

    // Find or get admin user
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Admin User",
        email: "admin@codehub.com",
        password: "Admin@123456",
        role: "admin",
        isEmailVerified: true,
      });
      console.log("Created admin user:", adminUser._id);
    } else {
      console.log("Found admin user:", adminUser._id);
    }

    // Find or get creator users (minimum 3)
    let creators = await User.find({ role: "creator" }).limit(3);

    if (creators.length < 3) {
      const existingCreatorCount = creators.length;
      const neededCreators = 3 - existingCreatorCount;

      for (let i = 0; i < neededCreators; i++) {
        const creator = await User.create({
          name: `Creator User ${existingCreatorCount + i + 1}`,
          email: `creator${existingCreatorCount + i + 1}@codehub.com`,
          password: `Creator@${existingCreatorCount + i + 1}`,
          role: "creator",
          isEmailVerified: true,
        });
        creators.push(creator);
        console.log(`Created creator user ${i + 1}:`, creator._id);
      }
    } else {
      console.log("Found 3 creator users");
    }

    // Define quiz template
    const createQuiz = (title, sectionOrder) => {
      const quizData = {
        title: `${title} Quiz`,
        description: `Assessment quiz for ${title}`,
        type: "section-quiz",
        questions: [
          {
            type: "multiple-choice",
            question: `What is the first concept in ${title}?`,
            description: "Select the correct answer",
            order: 1,
            options: [
              { text: "Concept A", isCorrect: true },
              { text: "Concept B", isCorrect: false },
              { text: "Concept C", isCorrect: false },
              { text: "Concept D", isCorrect: false },
            ],
            points: 10,
            explanation: "Concept A is the correct answer",
          },
          {
            type: "true-false",
            question: `${title} is always required for advanced programming.`,
            description: "Answer true or false",
            order: 2,
            options: [
              { text: "True", isCorrect: false },
              { text: "False", isCorrect: true },
            ],
            points: 10,
            explanation: "This statement is false because there are many exceptions",
          },
          {
            type: "multiple-choice",
            question: `Which is NOT a feature of ${title}?`,
            description: "Select the incorrect feature",
            order: 3,
            options: [
              { text: "Reusability", isCorrect: false },
              { text: "Scalability", isCorrect: false },
              { text: "Incompatibility", isCorrect: true },
              { text: "Maintainability", isCorrect: false },
            ],
            points: 10,
            explanation: "Incompatibility is not a feature but rather a drawback",
          },
        ],
        totalPoints: 30,
        passingScore: 60,
        timeLimit: 30,
        shuffleQuestions: true,
        shuffleOptions: true,
        showAnswerExplanation: true,
        retakeAllowed: true,
        maxRetakes: 3,
      };
      return quizData;
    };

    // Define lesson template
    const createLesson = (sectionTitle, lessonNumber, order) => ({
      title: `${sectionTitle} - Lesson ${lessonNumber}`,
      description: `Learn about lesson ${lessonNumber} in ${sectionTitle}`,
      content: `# ${sectionTitle} - Lesson ${lessonNumber}\n\nThis lesson covers fundamental concepts of ${sectionTitle}.\n\n## Key Topics:\n- Topic 1\n- Topic 2\n- Topic 3\n\n## Practice:\nTry the code examples and exercises below.`,
      order,
      difficulty: order % 2 === 0 ? "beginner" : "intermediate",
      estimatedHours: 1 + order,
      videoUrl: `https://example.com/videos/section-lesson-${order}`,
      duration: 3600,
      codeExamples: [
        {
          title: `Example ${lessonNumber}`,
          description: `Code example for lesson ${lessonNumber}`,
          code: `function example${lessonNumber}() {\n  console.log("Example ${lessonNumber}");\n}\n\nexample${lessonNumber}();`,
          language: "javascript",
          input: "",
          expectedOutput: `Example ${lessonNumber}`,
          order: 1,
          explanation: "This example demonstrates the basic concept",
        },
      ],
      notes: [
        `Important note for lesson ${lessonNumber}`,
        `Remember to practice this concept`,
      ],
      tips: [
        `Tip ${lessonNumber}: Focus on understanding the fundamentals`,
        `Tip ${lessonNumber + 1}: Practice makes perfect`,
      ],
      resources: [
        {
          title: "Official Documentation",
          url: "https://example.com/docs",
          type: "documentation",
          description: "Official reference for this lesson",
          order: 1,
        },
        {
          title: "Practice Problems",
          url: "https://example.com/practice",
          type: "example",
          description: "Practice problems for this lesson",
          order: 2,
        },
      ],
    });

    // Define section template with quiz and 3 lessons
    const createSection = async (title, order) => {
      // Create quiz first
      const quizData = createQuiz(title, order);
      const quiz = await Quiz.create(quizData);

      const section = {
        title,
        description: `${title} covers essential concepts and practical applications`,
        order,
        estimatedHours: 4.5,
        isLocked: false,
        unlockCondition: order > 1 ? `Complete Section ${order - 1}` : null,
        sectionQuiz: quiz._id,
        lessons: [
          createLesson(title, 1, 1),
          createLesson(title, 2, 2),
          createLesson(title, 3, 3),
        ],
      };
      return section;
    };

    const primaryCreator = creators[0];

    // Create sections for a course
    const createCourseSections = async () => {
      const section1 = await createSection("Fundamentals", 1);
      const section2 = await createSection("Intermediate Concepts", 2);
      const section3 = await createSection("Advanced Topics", 3);
      return [section1, section2, section3];
    };

    // Course data with 3 sections each having 3 lessons and quiz
    const coursesData = [
      // ===== ADMIN COURSES (2) =====
      {
        title: "Python Fundamentals Masterclass",
        description:
          "Complete Python course covering variables, control flow, functions, and object-oriented programming. This comprehensive course is designed for beginners to intermediate developers.",
        shortDescription: "Master Python from basics to advanced concepts",
        language: "python",
        category: "programming-language",
        difficulty: "beginner",
        instructor: adminUser._id,
        isPublished: true,
        status: "published",
        hasAdminApprovedPublish: true,
        isPremium: false,
        isFeatured: true,
        learningObjectives: [
          "Understand Python syntax and data types",
          "Master control flow and loops",
          "Write functions and work with modules",
          "Understand OOP principles",
        ],
        outcomes: [
          "Build real-world Python applications",
          "Understand Python best practices",
          "Work with libraries and frameworks",
        ],
        requirements: ["Basic computer knowledge", "Text editor or IDE"],
        targetAudience: "Beginner to Intermediate Programmers",
        enrollmentCount: 542,
        viewCount: 1250,
        completedCount: 340,
        averageRating: 4.7,
        ratingCount: 248,
        tags: ["python", "programming", "beginner", "fundamentals"],
        estimatedHours: 13.5,
        totalLessons: 9,
        totalSections: 3,
      },
      {
        title: "Web Development with JavaScript",
        description:
          "Learn modern JavaScript for web development. This course covers ES6+, DOM manipulation, async programming, and working with APIs. Perfect for building interactive web applications.",
        shortDescription: "Modern JavaScript for building web applications",
        language: "javascript",
        category: "web-development",
        difficulty: "intermediate",
        instructor: adminUser._id,
        isPublished: true,
        status: "published",
        hasAdminApprovedPublish: true,
        isPremium: true,
        isFeatured: true,
        learningObjectives: [
          "Master modern JavaScript syntax",
          "Work with DOM and events",
          "Handle asynchronous programming",
          "Fetch and consume APIs",
        ],
        outcomes: [
          "Build dynamic web pages",
          "Create responsive applications",
          "Work with real-world APIs",
        ],
        requirements: [
          "Basic HTML/CSS knowledge",
          "Familiarity with programming concepts",
        ],
        targetAudience: "Web Development Beginners",
        enrollmentCount: 891,
        viewCount: 2150,
        completedCount: 567,
        averageRating: 4.8,
        ratingCount: 456,
        tags: ["javascript", "web-development", "async", "api"],
        estimatedHours: 13.5,
        totalLessons: 9,
        totalSections: 3,
      },

      // ===== CREATOR COURSES (3) =====
      {
        title: `${creators[0]?.name || "Creator"}'s C++ Advanced Tutorial`,
        description:
          "Deep dive into C++ programming with focus on memory management, pointers, and data structures. This course is created by an experienced developer.",
        shortDescription: "Advanced C++ programming techniques and patterns",
        language: "cpp",
        category: "programming-language",
        difficulty: "advanced",
        instructor: primaryCreator._id,
        isPublished: true,
        status: "published",
        hasAdminApprovedPublish: false,
        isPremium: false,
        isFeatured: false,
        learningObjectives: [
          "Understand memory management",
          "Master pointers and references",
          "Implement data structures",
          "Write efficient C++ code",
        ],
        outcomes: [
          "Build efficient C++ applications",
          "Understand memory patterns",
          "Optimize code performance",
        ],
        requirements: ["Intermediate C++ knowledge", "Experience with pointers"],
        targetAudience: "Intermediate to Advanced C++ Developers",
        enrollmentCount: 145,
        viewCount: 380,
        completedCount: 98,
        averageRating: 4.5,
        ratingCount: 62,
        tags: ["cpp", "memory", "data-structures", "advanced"],
        estimatedHours: 13.5,
        totalLessons: 9,
        totalSections: 3,
      },
      {
        title: `${creators[1]?.name || "Creator"}'s SQL Database Design`,
        description:
          "Learn SQL and database design from a practical perspective. This course covers normalization, queries, and optimization techniques for real-world applications.",
        shortDescription: "SQL and relational database fundamentals",
        language: "sql",
        category: "databases",
        difficulty: "beginner",
        instructor: primaryCreator._id,
        isPublished: true,
        status: "published",
        hasAdminApprovedPublish: false,
        isPremium: false,
        isFeatured: false,
        learningObjectives: [
          "Understand database design principles",
          "Write efficient SQL queries",
          "Optimize database performance",
          "Work with multiple tables",
        ],
        outcomes: [
          "Design normalized databases",
          "Write complex queries",
          "Optimize database performance",
        ],
        requirements: ["No prior database knowledge needed"],
        targetAudience: "Database Beginners",
        enrollmentCount: 267,
        viewCount: 645,
        completedCount: 189,
        averageRating: 4.6,
        ratingCount: 134,
        tags: ["sql", "database", "queries", "fundamentals"],
        estimatedHours: 13.5,
        totalLessons: 9,
        totalSections: 3,
      },
      {
        title: `${creators[2]?.name || "Creator"}'s Algorithms & Problem Solving`,
        description:
          "Master algorithms and problem-solving techniques. This course covers sorting, searching, graph algorithms, and dynamic programming with practical examples.",
        shortDescription: "Essential algorithms for competitive programming",
        language: "cpp",
        category: "algorithms",
        difficulty: "intermediate",
        instructor: primaryCreator._id,
        isPublished: true,
        status: "published",
        hasAdminApprovedPublish: false,
        isPremium: true,
        isFeatured: false,
        learningObjectives: [
          "Understand algorithm complexity",
          "Master sorting algorithms",
          "Learn graph algorithms",
          "Apply dynamic programming",
        ],
        outcomes: [
          "Solve coding interview problems",
          "Understand algorithm optimization",
          "Implement efficient solutions",
        ],
        requirements: [
          "Basic programming knowledge",
          "Understanding of data structures",
        ],
        targetAudience: "Competitive Programmers",
        enrollmentCount: 423,
        viewCount: 1087,
        completedCount: 312,
        averageRating: 4.7,
        ratingCount: 198,
        tags: ["algorithms", "competitive", "dp", "graphs"],
        estimatedHours: 13.5,
        totalLessons: 9,
        totalSections: 3,
      },
    ];

    // Add sections with quizzes to each course
    for (let course of coursesData) {
      course.sections = await createCourseSections();
    }

    // Insert courses into database
    const createdCourses = await Course.insertMany(coursesData);

    for (const course of createdCourses) {
      for (const section of course.sections || []) {
        if (section.sectionQuiz) {
          await Quiz.updateOne(
            { _id: section.sectionQuiz },
            {
              $set: {
                course: course._id,
                section: section._id,
              },
            },
          );
        }
      }
    }

    console.log(`\nSuccessfully seeded ${createdCourses.length} courses!\n`);

    // Display detailed course information
    console.log("=".repeat(90));
    console.log("COURSE SEEDING SUMMARY");
    console.log("=".repeat(90));

    createdCourses.forEach((course, index) => {
      const isAdminCourse = course.instructor.equals(adminUser._id);
      const courseType = isAdminCourse ? "ADMIN" : "CREATOR";

      console.log(`\n${courseType} COURSE ${index + 1}: ${course.title}`);
      console.log("-".repeat(90));
      console.log(`ID: ${course._id}`);
      console.log(`Instructor: ${course.instructor}`);
      console.log(`Language: ${course.language} | Category: ${course.category}`);
      console.log(`Difficulty: ${course.difficulty} | Status: ${course.status}`);
      console.log(
        `Premium: ${course.isPremium} | Featured: ${course.isFeatured}`
      );
      console.log(`Estimated Hours: ${course.estimatedHours}`);

      console.log(`\nSections (${course.sections.length}):`);
      course.sections.forEach((section, sIdx) => {
        console.log(
          `  Section ${sIdx + 1}: ${section.title} (${section.lessons.length} lessons, 1 quiz)`
        );
        section.lessons.forEach((lesson, lIdx) => {
          console.log(`    - Lesson ${lIdx + 1}: ${lesson.title}`);
        });
        if (section.sectionQuiz) {
          console.log(`    - Quiz: Section ${sIdx + 1} Assessment`);
        }
      });

      console.log(
        `\nStats: ${course.enrollmentCount} enrolled | ${course.completedCount} completed | ${course.averageRating}/5 rating`
      );
    });

    console.log("\n" + "=".repeat(90));
    console.log("SEEDING COMPLETE");
    console.log("=".repeat(90));
    console.log(`Total Courses: ${createdCourses.length}`);
    console.log(`Admin Courses: 2 (with 3 sections, 9 lessons, 3 quizzes each)`);
    console.log(`Creator Courses: 3 (with 3 sections, 9 lessons, 3 quizzes each)`);
    console.log(`Total Quizzes Created: ${createdCourses.length * 3}`);
    console.log("=".repeat(90) + "\n");

  } catch (error) {
    console.error("Seeding failed:", error.message);
    throw error;
  }
};

export default seedCourses;
