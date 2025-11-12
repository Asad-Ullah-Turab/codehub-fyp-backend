import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

const seedCourses = async () => {
  try {
    console.log("🌱 Seeding courses...");

    // Find or create admin user
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = new User({
        name: "CodeHub Admin",
        email: "admin@codehub.com",
        password: "admin123",
        role: "admin",
        isEmailVerified: true,
        accountStatus: "active",
      });
      await admin.save();
      console.log("✅ Admin user created");
    }

    // Clear existing courses
    await Course.deleteMany({});
    await CourseSection.deleteMany({});
    await CourseLesson.deleteMany({});
    await Quiz.deleteMany({});

    // ========== PYTHON COURSE ==========
    const pythonCourse = new Course({
      title: "Python Fundamentals",
      description:
        "Master Python programming from basics to advanced concepts. Learn data types, functions, object-oriented programming, and more.",
      shortDescription:
        "Complete guide to Python programming for beginners",
      language: "python",
      category: "programming-language",
      difficulty: "beginner",
      instructor: admin._id,
      estimatedHours: 40,
      certificateTemplate: "standard",
      tags: ["python", "programming", "beginner", "fundamentals"],
      isPublished: true,
    });
    await pythonCourse.save();

    // Python - Section 1: Basics
    const pythonSection1 = new CourseSection({
      course: pythonCourse._id,
      title: "Getting Started with Python",
      description: "Introduction to Python and basic setup",
      order: 1,
    });
    await pythonSection1.save();

    const pythonLesson1_1 = new CourseLesson({
      section: pythonSection1._id,
      title: "Python Setup and Your First Program",
      description: "Install Python and write your first Hello World program",
      content: `
        <h2>Installing Python</h2>
        <p>Python is free and available on Windows, Mac, and Linux. Visit python.org to download the latest version.</p>
        <h2>Your First Program</h2>
        <p>Open a text editor and type the following code:</p>
        <pre>print("Hello, World!")</pre>
        <p>Save the file as hello.py and run it using your terminal or command prompt.</p>
      `,
      order: 1,
      duration: 15,
      difficulty: "beginner",
      estimatedHours: 0.5,
      codeExamples: [
        {
          title: "Hello World",
          description: "Your first Python program",
          code: 'print("Hello, World!")',
          expectedOutput: "Hello, World!",
          order: 1,
        },
      ],
    });
    await pythonLesson1_1.save();

    const pythonLesson1_2 = new CourseLesson({
      section: pythonSection1._id,
      title: "Variables and Data Types",
      description: "Learn about variables, strings, integers, and more",
      content: `
        <h2>Variables</h2>
        <p>Variables are containers for storing data values.</p>
        <h2>Data Types</h2>
        <ul>
          <li>String (str): Text values</li>
          <li>Integer (int): Whole numbers</li>
          <li>Float (float): Decimal numbers</li>
          <li>Boolean (bool): True or False</li>
        </ul>
      `,
      order: 2,
      duration: 20,
      difficulty: "beginner",
      estimatedHours: 0.75,
      codeExamples: [
        {
          title: "Variable Assignment",
          description: "Creating and using variables",
          code: `name = "John"
age = 25
height = 5.9
is_student = True
print(name, age, height, is_student)`,
          expectedOutput: "John 25 5.9 True",
          order: 1,
        },
      ],
    });
    await pythonLesson1_2.save();

    pythonSection1.lessons = [pythonLesson1_1._id, pythonLesson1_2._id];
    await pythonSection1.save();

    // Python - Quiz for Section 1
    const pythonQuiz1 = new Quiz({
      title: "Python Basics Quiz",
      description: "Test your knowledge of Python basics",
      type: "section-quiz",
      course: pythonCourse._id,
      section: pythonSection1._id,
      questions: [
        {
          type: "multiple-choice",
          question: "What is the correct way to print output in Python?",
          description: "Choose the correct print statement",
          order: 1,
          options: [
            { text: 'print("Hello")', isCorrect: true },
            { text: 'printf("Hello")', isCorrect: false },
            { text: 'echo "Hello"', isCorrect: false },
            { text: 'console.log("Hello")', isCorrect: false },
          ],
          points: 1,
          explanation:
            'In Python, we use the print() function to output text. print("Hello")',
        },
        {
          type: "multiple-choice",
          question: "Which data type is used for storing text in Python?",
          order: 2,
          options: [
            { text: "string", isCorrect: false },
            { text: "str", isCorrect: true },
            { text: "text", isCorrect: false },
            { text: "String", isCorrect: false },
          ],
          points: 1,
          explanation:
            "In Python, text is stored using the 'str' data type, which stands for string.",
        },
        {
          type: "true-false",
          question: "True or False: Variables in Python are declared before use.",
          order: 3,
          options: [
            { text: "True", isCorrect: false },
            { text: "False", isCorrect: true },
          ],
          points: 1,
          explanation:
            "In Python, variables are created when you assign a value to them.",
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await pythonQuiz1.save();
    pythonSection1.sectionQuiz = pythonQuiz1._id;
    await pythonSection1.save();

    // Python - Section 2: Control Flow
    const pythonSection2 = new CourseSection({
      course: pythonCourse._id,
      title: "Control Flow and Loops",
      description: "Master if statements, loops, and program flow",
      order: 2,
    });
    await pythonSection2.save();

    const pythonLesson2_1 = new CourseLesson({
      section: pythonSection2._id,
      title: "If Statements and Conditionals",
      description: "Learn how to make decisions in your code",
      content: `
        <h2>If Statements</h2>
        <p>Use if statements to execute code based on conditions.</p>
        <h2>Syntax</h2>
        <pre>
if condition:
    # code to execute if true
elif other_condition:
    # code to execute if other_condition is true
else:
    # code to execute if all conditions are false
        </pre>
      `,
      order: 1,
      duration: 25,
      difficulty: "beginner",
      estimatedHours: 1,
      codeExamples: [
        {
          title: "Simple If Statement",
          description: "Check if a number is positive",
          code: `num = 10
if num > 0:
    print("Positive")
elif num < 0:
    print("Negative")
else:
    print("Zero")`,
          expectedOutput: "Positive",
          order: 1,
        },
      ],
    });
    await pythonLesson2_1.save();

    const pythonLesson2_2 = new CourseLesson({
      section: pythonSection2._id,
      title: "Loops: For and While",
      description: "Repeat code with for and while loops",
      content: `
        <h2>For Loops</h2>
        <p>Use for loops to iterate over sequences.</p>
        <h2>While Loops</h2>
        <p>Use while loops to repeat code while a condition is true.</p>
      `,
      order: 2,
      duration: 30,
      difficulty: "beginner",
      estimatedHours: 1.25,
    });
    await pythonLesson2_2.save();

    pythonSection2.lessons = [pythonLesson2_1._id, pythonLesson2_2._id];
    await pythonSection2.save();

    // Add sections to course
    pythonCourse.sections = [pythonSection1._id, pythonSection2._id];
    pythonCourse.totalSections = 2;
    pythonCourse.totalLessons = 4;
    await pythonCourse.save();

    console.log("✅ Python Course created with sections and lessons");

    // ========== JAVASCRIPT COURSE ==========
    const jsCourse = new Course({
      title: "JavaScript Essentials",
      description:
        "Learn JavaScript from scratch. Master syntax, DOM manipulation, asynchronous programming, and more.",
      shortDescription: "Complete JavaScript tutorial for beginners",
      language: "javascript",
      category: "programming-language",
      difficulty: "beginner",
      instructor: admin._id,
      estimatedHours: 45,
      certificateTemplate: "standard",
      tags: ["javascript", "web", "beginner"],
      isPublished: true,
    });
    await jsCourse.save();

    const jsSection1 = new CourseSection({
      course: jsCourse._id,
      title: "JavaScript Basics",
      description: "Introduction to JavaScript",
      order: 1,
    });
    await jsSection1.save();

    const jsLesson1_1 = new CourseLesson({
      section: jsSection1._id,
      title: "Introduction to JavaScript",
      description: "Learn the basics of JavaScript",
      content: `
        <h2>What is JavaScript?</h2>
        <p>JavaScript is a programming language that runs in web browsers.</p>
        <h2>Getting Started</h2>
        <p>You can write JavaScript in script tags in HTML or in separate .js files.</p>
      `,
      order: 1,
      duration: 20,
      difficulty: "beginner",
      estimatedHours: 0.75,
      codeExamples: [
        {
          title: "Hello World in JavaScript",
          description: "Your first JavaScript program",
          code: 'console.log("Hello, World!");',
          expectedOutput: "Hello, World!",
          order: 1,
        },
      ],
    });
    await jsLesson1_1.save();

    jsSection1.lessons = [jsLesson1_1._id];
    await jsSection1.save();

    jsCourse.sections = [jsSection1._id];
    jsCourse.totalSections = 1;
    jsCourse.totalLessons = 1;
    await jsCourse.save();

    console.log("✅ JavaScript Course created");

    // ========== C++ COURSE ==========
    const cppCourse = new Course({
      title: "C++ Programming",
      description:
        "Master C++ from basics to advanced topics. Learn object-oriented programming, memory management, and system programming.",
      shortDescription: "Comprehensive C++ tutorial",
      language: "cpp",
      category: "programming-language",
      difficulty: "intermediate",
      instructor: admin._id,
      estimatedHours: 50,
      certificateTemplate: "standard",
      tags: ["cpp", "c++", "system-programming"],
      isPublished: true,
    });
    await cppCourse.save();

    const cppSection1 = new CourseSection({
      course: cppCourse._id,
      title: "C++ Fundamentals",
      description: "Basic concepts in C++",
      order: 1,
    });
    await cppSection1.save();

    const cppLesson1_1 = new CourseLesson({
      section: cppSection1._id,
      title: "Getting Started with C++",
      description: "Setup and first C++ program",
      content: `
        <h2>What is C++?</h2>
        <p>C++ is a powerful, general-purpose programming language.</p>
        <h2>Hello World Program</h2>
        <pre>
#include &lt;iostream&gt;
using namespace std;

int main() {
    cout &lt;&lt; "Hello, World!" &lt;&lt; endl;
    return 0;
}
        </pre>
      `,
      order: 1,
      duration: 25,
      difficulty: "intermediate",
      estimatedHours: 1,
      codeExamples: [
        {
          title: "Hello World in C++",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
          expectedOutput: "Hello, World!",
          order: 1,
        },
      ],
    });
    await cppLesson1_1.save();

    cppSection1.lessons = [cppLesson1_1._id];
    await cppSection1.save();

    cppCourse.sections = [cppSection1._id];
    cppCourse.totalSections = 1;
    cppCourse.totalLessons = 1;
    await cppCourse.save();

    console.log("✅ C++ Course created");

    // ========== DATA STRUCTURES COURSE ==========
    const dsCourse = new Course({
      title: "Data Structures Mastery",
      description:
        "Learn essential data structures: arrays, linked lists, stacks, queues, trees, and graphs. Includes algorithms and complexity analysis.",
      shortDescription: "Master fundamental data structures",
      language: "python",
      category: "data-structures",
      difficulty: "intermediate",
      instructor: admin._id,
      estimatedHours: 60,
      certificateTemplate: "standard",
      tags: ["data-structures", "algorithms", "intermediate"],
      isPublished: true,
    });
    await dsCourse.save();

    const dsSection1 = new CourseSection({
      course: dsCourse._id,
      title: "Arrays and Linked Lists",
      description: "Learn linear data structures",
      order: 1,
    });
    await dsSection1.save();

    const dsLesson1_1 = new CourseLesson({
      section: dsSection1._id,
      title: "Understanding Arrays",
      description: "Learn how arrays work and their operations",
      content: `
        <h2>What is an Array?</h2>
        <p>An array is a collection of elements stored in contiguous memory locations.</p>
        <h2>Array Operations</h2>
        <ul>
          <li>Access: O(1)</li>
          <li>Search: O(n)</li>
          <li>Insertion: O(n)</li>
          <li>Deletion: O(n)</li>
        </ul>
      `,
      order: 1,
      duration: 30,
      difficulty: "intermediate",
      estimatedHours: 1.5,
    });
    await dsLesson1_1.save();

    dsSection1.lessons = [dsLesson1_1._id];
    await dsSection1.save();

    dsCourse.sections = [dsSection1._id];
    dsCourse.totalSections = 1;
    dsCourse.totalLessons = 1;
    await dsCourse.save();

    console.log("✅ Data Structures Course created");

    // ========== ALGORITHMS COURSE ==========
    const algoCourse = new Course({
      title: "Algorithm Design and Analysis",
      description:
        "Master algorithm design, analysis, and implementation. Learn sorting, searching, dynamic programming, and graph algorithms.",
      shortDescription: "Comprehensive algorithms course",
      language: "python",
      category: "algorithms",
      difficulty: "advanced",
      instructor: admin._id,
      estimatedHours: 70,
      certificateTemplate: "standard",
      tags: ["algorithms", "advanced"],
      isPublished: true,
    });
    await algoCourse.save();

    const algoSection1 = new CourseSection({
      course: algoCourse._id,
      title: "Sorting Algorithms",
      description: "Learn various sorting techniques",
      order: 1,
    });
    await algoSection1.save();

    const algoLesson1_1 = new CourseLesson({
      section: algoSection1._id,
      title: "Quick Sort and Merge Sort",
      description: "Learn efficient sorting algorithms",
      content: `
        <h2>Quick Sort</h2>
        <p>Time Complexity: O(n log n) average, O(n²) worst case</p>
        <h2>Merge Sort</h2>
        <p>Time Complexity: O(n log n) all cases</p>
      `,
      order: 1,
      duration: 45,
      difficulty: "advanced",
      estimatedHours: 2,
    });
    await algoLesson1_1.save();

    algoSection1.lessons = [algoLesson1_1._id];
    await algoSection1.save();

    algoCourse.sections = [algoSection1._id];
    algoCourse.totalSections = 1;
    algoCourse.totalLessons = 1;
    await algoCourse.save();

    console.log("✅ Algorithms Course created");

    console.log("✨ All courses seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
    throw error;
  }
};

export default seedCourses;
