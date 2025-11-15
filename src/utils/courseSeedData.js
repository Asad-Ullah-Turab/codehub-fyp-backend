import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

const seedCourses = async () => {
  try {
    console.log("🌱 Seeding courses...");

    // Clear existing courses
    await Course.deleteMany({});
    await CourseSection.deleteMany({});
    await CourseLesson.deleteMany({});
    await Quiz.deleteMany({});

    // Get admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("Admin user not found. Please seed users first.");
    }

    // ========== PYTHON COURSE - COMPREHENSIVE ==========
    const pythonCourse = new Course({
      title: "Python Programming Mastery",
      description:
        "Become a Python expert with this comprehensive course covering everything from basic syntax to advanced concepts like OOP, file handling, and web development fundamentals.",
      shortDescription:
        "Complete Python programming course for beginners to advanced",
      language: "python",
      category: "programming-language",
      difficulty: "beginner",
      instructor: admin._id,
      estimatedHours: 60,
      certificateTemplate: "standard",
      tags: [
        "python",
        "programming",
        "beginner",
        "web-development",
        "automation",
      ],
      isPublished: true,
      thumbnail:
        "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=500",
    });
    await pythonCourse.save();

    // Python - Section 1: Python Fundamentals
    const pythonSection1 = new CourseSection({
      course: pythonCourse._id,
      title: "Python Fundamentals",
      description: "Master the basics of Python programming language",
      order: 1,
    });
    await pythonSection1.save();

    const pythonLesson1_1 = new CourseLesson({
      section: pythonSection1._id,
      title: "Getting Started with Python",
      description: "Setup Python environment and write your first programs",
      content: `
        <h2>Why Python?</h2>
        <p>Python is one of the most popular programming languages in the world, known for its simplicity and readability.</p>
        
        <h2>Installing Python</h2>
        <p><strong>Windows:</strong> Download from python.org and run the installer</p>
        <p><strong>Mac:</strong> Use Homebrew: <code>brew install python</code></p>
        <p><strong>Linux:</strong> Use package manager: <code>sudo apt install python3</code></p>
        
        <h2>Your First Python Program</h2>
        <p>Create a file called <code>hello.py</code> and add the following code:</p>
      `,
      order: 1,
      duration: 25,
      difficulty: "beginner",
      estimatedHours: 1,
      codeExamples: [
        {
          title: "Hello World",
          description: "Traditional first program in Python",
          code: `print("Hello, World!")
print("Welcome to Python Programming!")`,
          expectedOutput: `Hello, World!\nWelcome to Python Programming!`,
          order: 1,
        },
        {
          title: "Simple Calculator",
          description: "Basic arithmetic operations",
          code: `# Basic arithmetic
print(5 + 3)
print(10 - 4)
print(6 * 7)
print(15 / 3)`,
          expectedOutput: `8\n6\n42\n5.0`,
          order: 2,
        },
      ],
    });
    await pythonLesson1_1.save();

    const pythonLesson1_2 = new CourseLesson({
      section: pythonSection1._id,
      title: "Variables, Data Types and Operators",
      description: "Learn about Python's data types and how to work with them",
      content: `
        <h2>Variables in Python</h2>
        <p>Variables are like containers that store data values. In Python, you don't need to declare variable types.</p>
        
        <h2>Basic Data Types</h2>
        <ul>
          <li><strong>String (str):</strong> Text data, enclosed in quotes</li>
          <li><strong>Integer (int):</strong> Whole numbers</li>
          <li><strong>Float (float):</strong> Decimal numbers</li>
          <li><strong>Boolean (bool):</strong> True or False values</li>
          <li><strong>List:</strong> Ordered, mutable collection</li>
          <li><strong>Tuple:</strong> Ordered, immutable collection</li>
          <li><strong>Dictionary:</strong> Key-value pairs</li>
        </ul>
        
        <h2>Operators</h2>
        <p>Python supports arithmetic, comparison, logical, and assignment operators.</p>
      `,
      order: 2,
      duration: 35,
      difficulty: "beginner",
      estimatedHours: 1.5,
      codeExamples: [
        {
          title: "Variables and Data Types",
          description: "Working with different data types",
          code: `# Strings
name = "Alice"
message = 'Hello, ' + name

# Numbers
age = 25
height = 5.8
is_student = True

# Collections
fruits = ["apple", "banana", "orange"]
coordinates = (10, 20)
person = {"name": "Bob", "age": 30}

print(message)
print(f"Age: {age}, Height: {height}")
print(fruits)`,
          expectedOutput: `Hello, Alice\nAge: 25, Height: 5.8\n['apple', 'banana', 'orange']`,
          order: 1,
        },
      ],
    });
    await pythonLesson1_2.save();

    // Python - Section 2: Control Flow
    const pythonSection2 = new CourseSection({
      course: pythonCourse._id,
      title: "Control Flow and Functions",
      description: "Master program flow control and function creation",
      order: 2,
    });
    await pythonSection2.save();

    const pythonLesson2_1 = new CourseLesson({
      section: pythonSection2._id,
      title: "Conditional Statements and Loops",
      description: "Make decisions and repeat actions in your code",
      content: `
        <h2>Conditional Statements</h2>
        <p>Use <code>if</code>, <code>elif</code>, and <code>else</code> to make decisions in your code.</p>
        
        <h2>Looping Structures</h2>
        <p><strong>For loops:</strong> Iterate over sequences (lists, strings, etc.)</p>
        <p><strong>While loops:</strong> Repeat while a condition is true</p>
        
        <h2>Loop Control</h2>
        <p>Use <code>break</code> to exit loops and <code>continue</code> to skip iterations.</p>
      `,
      order: 1,
      duration: 40,
      difficulty: "beginner",
      estimatedHours: 2,
      codeExamples: [
        {
          title: "If-Else Statements",
          description: "Making decisions in code",
          code: `# Grade calculator
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Score: {score}, Grade: {grade}")`,
          expectedOutput: "Score: 85, Grade: B",
          order: 1,
        },
        {
          title: "For and While Loops",
          description: "Different ways to loop in Python",
          code: `# For loop with list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}")

# While loop
count = 1
while count <= 5:
    print(f"Count: {count}")
    count += 1`,
          expectedOutput: `I like apple\nI like banana\nI like cherry\nCount: 1\nCount: 2\nCount: 3\nCount: 4\nCount: 5`,
          order: 2,
        },
      ],
    });
    await pythonLesson2_1.save();

    // Python - Quiz for Section 1
    const pythonQuiz1 = new Quiz({
      title: "Python Fundamentals Quiz",
      description: "Test your understanding of Python basics",
      type: "section-quiz",
      course: pythonCourse._id,
      section: pythonSection1._id,
      questions: [
        {
          type: "multiple-choice",
          question: "What is the correct way to create a variable in Python?",
          description: "Choose the proper variable assignment",
          order: 1,
          options: [
            { text: 'variable name = "value"', isCorrect: false },
            { text: 'name = "value"', isCorrect: true },
            { text: 'String name = "value"', isCorrect: false },
            { text: 'var name = "value"', isCorrect: false },
          ],
          points: 1,
          explanation:
            "In Python, variables are created by simply assigning a value using the = operator.",
        },
        {
          type: "multiple-choice",
          question: "Which of these is NOT a valid data type in Python?",
          order: 2,
          options: [
            { text: "list", isCorrect: false },
            { text: "tuple", isCorrect: false },
            { text: "array", isCorrect: true },
            { text: "dictionary", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Python has 'list' but not 'array' as a built-in data type. Arrays require importing external modules.",
        },
        {
          type: "true-false",
          question: "Python is a case-sensitive programming language.",
          order: 3,
          options: [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false },
          ],
          points: 1,
          explanation:
            "Yes, Python is case-sensitive. 'Name' and 'name' would be different variables.",
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await pythonQuiz1.save();

    pythonSection1.lessons = [pythonLesson1_1._id, pythonLesson1_2._id];
    pythonSection1.sectionQuiz = pythonQuiz1._id;
    await pythonSection1.save();

    // ========== JAVASCRIPT COURSE - COMPREHENSIVE ==========
    const jsCourse = new Course({
      title: "Modern JavaScript Development",
      description:
        "Master JavaScript for web development. Learn ES6+ features, DOM manipulation, asynchronous programming, and build real-world projects.",
      shortDescription: "Complete JavaScript course for modern web development",
      language: "javascript",
      category: "web-development",
      difficulty: "beginner",
      instructor: admin._id,
      estimatedHours: 55,
      certificateTemplate: "standard",
      tags: ["javascript", "web-development", "frontend", "es6"],
      isPublished: true,
      thumbnail:
        "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500",
    });
    await jsCourse.save();

    // JavaScript - Section 1: JS Fundamentals
    const jsSection1 = new CourseSection({
      course: jsCourse._id,
      title: "JavaScript Basics",
      description: "Learn JavaScript fundamentals and core concepts",
      order: 1,
    });
    await jsSection1.save();

    const jsLesson1_1 = new CourseLesson({
      section: jsSection1._id,
      title: "JavaScript Introduction & Setup",
      description: "Get started with JavaScript in browser and Node.js",
      content: `
        <h2>What is JavaScript?</h2>
        <p>JavaScript is the programming language of the web, running in browsers and now on servers with Node.js.</p>
        
        <h2>Where to Write JavaScript</h2>
        <ul>
          <li><strong>Browser Console:</strong> Quick testing and debugging</li>
          <li><strong>HTML Script Tags:</strong> Embedded in web pages</li>
          <li><strong>External .js Files:</strong> Separate files for better organization</li>
          <li><strong>Node.js:</strong> Server-side JavaScript</li>
        </ul>
        
        <h2>Developer Tools</h2>
        <p>Learn to use browser developer tools for debugging and testing your JavaScript code.</p>
      `,
      order: 1,
      duration: 20,
      difficulty: "beginner",
      estimatedHours: 1,
      codeExamples: [
        {
          title: "Browser JavaScript",
          description: "Basic JavaScript in browser context",
          code: `// Alert message
alert("Welcome to JavaScript!");

// Console output
console.log("Hello, Developer!");

// Document interaction
document.write("<h1>JavaScript is running!</h1>");`,
          expectedOutput: "Shows alert and writes to document",
          order: 1,
        },
      ],
    });
    await jsLesson1_1.save();

    const jsLesson1_2 = new CourseLesson({
      section: jsSection1._id,
      title: "Variables, Functions and Scope",
      description: "Master variable declaration and function creation",
      content: `
        <h2>Variable Declaration</h2>
        <p><strong>var:</strong> Function-scoped, can be redeclared</p>
        <p><strong>let:</strong> Block-scoped, cannot be redeclared</p>
        <p><strong>const:</strong> Block-scoped, constant value</p>
        
        <h2>Functions in JavaScript</h2>
        <p>Functions are first-class citizens in JavaScript and can be:</p>
        <ul>
          <li>Declared with function keyword</li>
          <li>Assigned to variables</li>
          <li>Passed as arguments</li>
          <li>Returned from other functions</li>
        </ul>
        
        <h2>Arrow Functions</h2>
        <p>Modern ES6 syntax for concise function expressions.</p>
      `,
      order: 2,
      duration: 30,
      difficulty: "beginner",
      estimatedHours: 1.5,
      codeExamples: [
        {
          title: "Variables and Functions",
          description: "Different ways to declare variables and functions",
          code: `// Variable declarations
var oldVariable = "I'm function scoped";
let modernVariable = "I'm block scoped";
const constantVariable = "I cannot be reassigned";

// Function declarations
function greet(name) {
    return "Hello, " + name;
}

// Arrow function
const greetArrow = (name) => \`Hello, \${name}\`;

console.log(greet("Alice"));
console.log(greetArrow("Bob"));`,
          expectedOutput: "Hello, Alice\nHello, Bob",
          order: 1,
        },
      ],
    });
    await jsLesson1_2.save();

    // JavaScript - Section 2: DOM Manipulation
    const jsSection2 = new CourseSection({
      course: jsCourse._id,
      title: "DOM Manipulation and Events",
      description: "Learn to interact with web pages and handle user events",
      order: 2,
    });
    await jsSection2.save();

    // JavaScript - Quiz for Section 1
    const jsQuiz1 = new Quiz({
      title: "JavaScript Basics Quiz",
      description: "Test your JavaScript fundamental knowledge",
      type: "section-quiz",
      course: jsCourse._id,
      section: jsSection1._id,
      questions: [
        {
          type: "multiple-choice",
          question: "Which keyword creates a constant variable in JavaScript?",
          order: 1,
          options: [
            { text: "let", isCorrect: false },
            { text: "var", isCorrect: false },
            { text: "const", isCorrect: true },
            { text: "constant", isCorrect: false },
          ],
          points: 1,
          explanation:
            "The 'const' keyword is used to declare constants in JavaScript.",
        },
        {
          type: "multiple-choice",
          question: "What will console.log(typeof null) output?",
          order: 2,
          options: [
            { text: "null", isCorrect: false },
            { text: "undefined", isCorrect: false },
            { text: "object", isCorrect: true },
            { text: "string", isCorrect: false },
          ],
          points: 1,
          explanation:
            "This is a known quirk in JavaScript - typeof null returns 'object'.",
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await jsQuiz1.save();

    jsSection1.lessons = [jsLesson1_1._id, jsLesson1_2._id];
    jsSection1.sectionQuiz = jsQuiz1._id;
    await jsSection1.save();

    // ========== WEB DEVELOPMENT COURSE - COMPREHENSIVE ==========
    const webCourse = new Course({
      title: "Full Stack Web Development",
      description:
        "Learn complete web development with HTML, CSS, JavaScript, Node.js and databases. Build responsive websites and web applications.",
      shortDescription: "Complete full-stack web development course",
      language: "javascript",
      category: "web-development",
      difficulty: "intermediate",
      instructor: admin._id,
      estimatedHours: 80,
      certificateTemplate: "excellence",
      tags: ["html", "css", "javascript", "nodejs", "fullstack"],
      isPublished: true,
      thumbnail:
        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500",
    });
    await webCourse.save();

    // Web Dev - Section 1: Frontend Fundamentals
    const webSection1 = new CourseSection({
      course: webCourse._id,
      title: "Frontend Development",
      description: "Master HTML, CSS and responsive design",
      order: 1,
    });
    await webSection1.save();

    const webLesson1_1 = new CourseLesson({
      section: webSection1._id,
      title: "HTML5 & Semantic Web",
      description: "Build structured, accessible web pages with HTML5",
      content: `
        <h2>HTML5 Introduction</h2>
        <p>HTML5 is the latest version of HyperText Markup Language with new semantic elements and APIs.</p>
        
        <h2>Semantic HTML Elements</h2>
        <ul>
          <li><strong>&lt;header&gt;</strong> - Introductory content</li>
          <li><strong>&lt;nav&gt;</strong> - Navigation links</li>
          <li><strong>&lt;main&gt;</strong> - Main content</li>
          <li><strong>&lt;article&gt;</strong> - Self-contained composition</li>
          <li><strong>&lt;section&gt;</strong> - Thematic grouping</li>
          <li><strong>&lt;footer&gt;</strong> - Footer content</li>
        </ul>
        
        <h2>Accessibility</h2>
        <p>Learn to create websites that are accessible to all users, including those with disabilities.</p>
      `,
      order: 1,
      duration: 35,
      difficulty: "beginner",
      estimatedHours: 1.5,
      codeExamples: [
        {
          title: "Semantic HTML Structure",
          description: "Proper HTML5 document structure",
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <header>
        <h1>Website Title</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <article>
            <h2>Article Title</h2>
            <p>Article content...</p>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2024 My Website</p>
    </footer>
</body>
</html>`,
          expectedOutput: "Structured HTML document",
          order: 1,
        },
      ],
    });
    await webLesson1_1.save();

    const webLesson1_2 = new CourseLesson({
      section: webSection1._id,
      title: "CSS3 & Responsive Design",
      description: "Style websites and make them responsive for all devices",
      content: `
        <h2>CSS3 Features</h2>
        <p>CSS3 introduces new features like flexbox, grid, transitions, and animations.</p>
        
        <h2>Flexbox Layout</h2>
        <p>One-dimensional layout system for arranging items in rows or columns.</p>
        
        <h2>CSS Grid</h2>
        <p>Two-dimensional layout system for complex web layouts.</p>
        
        <h2>Responsive Design</h2>
        <p>Create websites that work on all screen sizes using media queries and responsive units.</p>
      `,
      order: 2,
      duration: 45,
      difficulty: "intermediate",
      estimatedHours: 2,
      codeExamples: [
        {
          title: "Responsive Grid Layout",
          description: "CSS Grid for responsive design",
          code: `.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px;
}

.card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}`,
          expectedOutput: "Responsive grid layout",
          order: 1,
        },
      ],
    });
    await webLesson1_2.save();

    // Web Dev - Quiz for Section 1
    const webQuiz1 = new Quiz({
      title: "Frontend Fundamentals Quiz",
      description: "Test your HTML and CSS knowledge",
      type: "section-quiz",
      course: webCourse._id,
      section: webSection1._id,
      questions: [
        {
          type: "multiple-choice",
          question: "Which HTML5 element is used for navigation links?",
          order: 1,
          options: [
            { text: "&lt;nav&gt;", isCorrect: true },
            { text: "&lt;navigation&gt;", isCorrect: false },
            { text: "&lt;links&gt;", isCorrect: false },
            { text: "&lt;menu&gt;", isCorrect: false },
          ],
          points: 1,
          explanation:
            "The &lt;nav&gt; element is specifically designed for navigation sections.",
        },
        {
          type: "multiple-choice",
          question: "Which CSS property is used for flexible layouts?",
          order: 2,
          options: [
            { text: "display: block", isCorrect: false },
            { text: "display: flex", isCorrect: true },
            { text: "display: inline", isCorrect: false },
            { text: "display: table", isCorrect: false },
          ],
          points: 1,
          explanation: "display: flex enables the flexbox layout system.",
        },
      ],
      passingScore: 70,
      isPublished: true,
    });
    await webQuiz1.save();

    webSection1.lessons = [webLesson1_1._id, webLesson1_2._id];
    webSection1.sectionQuiz = webQuiz1._id;
    await webSection1.save();

    // Update course sections and totals
    pythonCourse.sections = [pythonSection1._id, pythonSection2._id];
    pythonCourse.totalSections = 2;
    pythonCourse.totalLessons = 3;
    await pythonCourse.save();

    jsCourse.sections = [jsSection1._id, jsSection2._id];
    jsCourse.totalSections = 2;
    jsCourse.totalLessons = 2;
    await jsCourse.save();

    webCourse.sections = [webSection1._id];
    webCourse.totalSections = 1;
    webCourse.totalLessons = 2;
    await webCourse.save();

    console.log("✅ Python Course created with detailed content");
    console.log("✅ JavaScript Course created with detailed content");
    console.log("✅ Web Development Course created with detailed content");
    console.log(
      "✨ All 3 courses seeded successfully with comprehensive content!"
    );
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
    throw error;
  }
};

export default seedCourses;
