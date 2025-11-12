# Course System API Documentation

## Overview
The CodeHub Course System provides a complete learning management system with courses, sections, lessons, quizzes, and certificates. Users can enroll in courses, track progress, take quizzes, and earn certificates upon completion.

---

## Core Models

### 1. Course
Main course container with metadata and enrollment tracking.

**Fields:**
- `title` (string, required): Course title
- `description` (string, required): Detailed course description
- `shortDescription` (string, required): Brief description for listings
- `language` (enum): "python", "cpp", "javascript", "sql", "rust", "haskell"
- `category` (enum): "programming-language", "data-structures", "algorithms", "web-development", "other"
- `difficulty` (enum): "beginner", "intermediate", "advanced"
- `instructor` (ObjectId, ref: User): Course creator/instructor
- `sections` (array of ObjectId): Course sections
- `finalQuiz` (ObjectId, ref: Quiz): Final assessment quiz
- `thumbnail` (string): Course image URL
- `estimatedHours` (number): Estimated completion time
- `enrollmentCount` (number): Total enrollments
- `averageRating` (number): User rating (0-5)
- `isPublished` (boolean): Published status
- `tags` (array of strings): Search tags
- `prerequisites` (array of ObjectId): Required courses

### 2. CourseSection
Organized sections within a course.

**Fields:**
- `course` (ObjectId, required): Parent course
- `title` (string, required): Section title
- `description` (string): Section description
- `order` (number, required): Display order
- `lessons` (array of ObjectId): Lessons in section
- `sectionQuiz` (ObjectId, ref: Quiz): Section assessment
- `estimatedHours` (number): Time to complete

### 3. CourseLesson
Individual lessons within sections.

**Fields:**
- `section` (ObjectId, required): Parent section
- `title` (string, required): Lesson title
- `description` (string): Lesson description
- `content` (string, required): HTML lesson content
- `order` (number, required): Display order
- `videoUrl` (string): Embedded video URL
- `duration` (number): Video duration in minutes
- `codeExamples` (array): Code examples with output
- `practiceProblems` (array of ObjectId): Practice code snippets
- `difficulty` (enum): "beginner", "intermediate", "advanced"
- `estimatedHours` (number): Time to complete

### 4. Quiz
Assessment quizzes for sections and final evaluation.

**Fields:**
- `title` (string, required): Quiz title
- `description` (string): Quiz description
- `type` (enum): "section-quiz", "final-quiz", "practice-quiz"
- `course` (ObjectId): Parent course
- `section` (ObjectId): Parent section
- `questions` (array): Quiz questions with answers
- `totalPoints` (number): Total possible points
- `passingScore` (number): Passing percentage (0-100)
- `timeLimit` (number): Time limit in minutes (0 = no limit)
- `shuffleQuestions` (boolean): Randomize question order
- `maxRetakes` (number): Maximum retake attempts
- `showAnswerExplanation` (boolean): Show explanations after submission

### 5. CourseEnrollment
Tracks user enrollment and progress in courses.

**Fields:**
- `user` (ObjectId, required): Enrolled user
- `course` (ObjectId, required): Enrolled course
- `status` (enum): "active", "completed", "dropped", "on-hold"
- `sectionProgress` (array): Progress per section
- `overallProgress` (number): Course progress percentage (0-100)
- `finalQuizScore` (object): Final assessment results
- `totalTimeSpentMinutes` (number): Total study time
- `certificate` (ObjectId, ref: Certificate): Issued certificate
- `certificateIssued` (boolean): Certificate status

### 6. Certificate
Proof of completion for successful course completion.

**Fields:**
- `user` (ObjectId, required): Certificate recipient
- `course` (ObjectId, required): Related course
- `enrollment` (ObjectId, required): Enrollment record
- `certificateNumber` (string): Unique certificate ID
- `issuedDate` (Date): Issuance date
- `expiryDate` (Date): Expiration date (null = no expiry)
- `finalScore` (number): Course completion score
- `isValid` (boolean): Certificate validity

---

## API Endpoints

### Public Course Endpoints

#### Get All Courses
```
GET /api/courses
Query Parameters:
  - language: "python", "cpp", "javascript", etc.
  - category: "programming-language", "data-structures", etc.
  - difficulty: "beginner", "intermediate", "advanced"
  - page: pagination (default: 1)
  - limit: results per page (default: 10)

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Python Fundamentals",
      "description": "...",
      "language": "python",
      "category": "programming-language",
      "difficulty": "beginner",
      "instructor": { "name": "...", "email": "..." },
      "sections": [...],
      "enrollmentCount": 150,
      "averageRating": 4.5
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "currentPage": 1,
    "limit": 10
  }
}
```

#### Get Single Course
```
GET /api/courses/:id

Response:
{
  "success": true,
  "data": {
    "course": { ... full course details ... },
    "enrollment": { ... user's enrollment if authenticated ... }
  }
}
```

#### Get Courses by Language
```
GET /api/courses/language/:language
Query Parameters:
  - page: pagination
  - limit: results per page
```

---

### Protected User Endpoints (Requires Authentication)

#### Enroll in Course
```
POST /api/courses/enroll
Body:
{
  "courseId": "..."
}

Response:
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "_id": "enrollment_id",
    "user": "user_id",
    "course": "course_id",
    "status": "active",
    "overallProgress": 0,
    "enrollmentDate": "2024-01-15T10:00:00Z"
  }
}
```

#### Get User's Enrolled Courses
```
GET /api/courses/user/enrolled
Query Parameters:
  - status: "active", "completed", "dropped", "on-hold"
  - page: pagination
  - limit: results per page

Response:
{
  "success": true,
  "data": [
    {
      "course": { ... course details ... },
      "status": "active",
      "overallProgress": 45,
      "enrollmentDate": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### Get Enrollment Details
```
GET /api/courses/:courseId/enrollment

Response:
{
  "success": true,
  "data": {
    "course": { ... },
    "status": "active",
    "overallProgress": 45,
    "sectionProgress": [
      {
        "section": { ... },
        "isCompleted": false,
        "lessons": [
          {
            "lesson": "lesson_id",
            "isCompleted": true,
            "completedAt": "2024-01-16T10:00:00Z"
          }
        ],
        "sectionQuizScore": {
          "score": 85,
          "maxScore": 100,
          "passed": true
        }
      }
    ]
  }
}
```

#### Mark Lesson as Complete
```
PUT /api/courses/:courseId/progress/lesson
Body:
{
  "sectionId": "...",
  "lessonId": "..."
}

Response:
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": { ... updated enrollment ... }
}
```

---

### Quiz Endpoints

#### Submit Quiz Answers
```
POST /api/admin/courses/quizzes/:quizId/submit
Body:
{
  "courseId": "...",
  "sectionId": "...",
  "answers": {
    "question_id_1": "answer_text",
    "question_id_2": "answer_text"
  }
}

Response:
{
  "success": true,
  "data": {
    "score": 85,
    "maxScore": 100,
    "passed": true,
    "attemptCount": 1,
    "results": [
      {
        "questionId": "...",
        "question": "What is...?",
        "userAnswer": "answer",
        "isCorrect": true,
        "explanation": "...",
        "points": 1
      }
    ],
    "certificate": null  // if final quiz and passed
  }
}
```

#### Get Quiz Details
```
GET /api/admin/courses/quizzes/:quizId

Response:
{
  "success": true,
  "data": {
    "quiz": {
      "_id": "...",
      "title": "Python Basics Quiz",
      "type": "section-quiz",
      "questions": [
        {
          "_id": "...",
          "type": "multiple-choice",
          "question": "...",
          "options": [
            { "text": "Option 1", "isCorrect": true },
            { "text": "Option 2", "isCorrect": false }
          ],
          "points": 1
        }
      ],
      "passingScore": 70,
      "timeLimit": 30,
      "maxRetakes": 3
    },
    "previousScore": { "score": 75, "passed": true },
    "canRetake": true
  }
}
```

#### Get Quiz Leaderboard
```
GET /api/admin/courses/quizzes/:quizId/leaderboard
Query Parameters:
  - limit: number of entries (default: 10)

Response:
{
  "success": true,
  "data": [
    {
      "user": { "name": "John Doe", "profilePicture": "..." },
      "score": 95,
      "attemptCount": 1,
      "lastAttemptAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

---

### Certificate Endpoints

#### Get User's Certificates
```
GET /api/admin/courses/user/certificates
Query Parameters:
  - page: pagination
  - limit: results per page

Response:
{
  "success": true,
  "data": [
    {
      "_id": "cert_id",
      "certificateNumber": "CERT-2024-1234-567890",
      "course": { "title": "Python Fundamentals" },
      "issuedDate": "2024-01-20T10:00:00Z",
      "finalScore": 92,
      "isValid": true
    }
  ],
  "pagination": { ... }
}
```

#### Get Certificate Details
```
GET /api/admin/courses/certificates/:certificateId

Response:
{
  "success": true,
  "data": {
    "_id": "cert_id",
    "certificateNumber": "CERT-2024-1234-567890",
    "course": { ... },
    "user": { "name": "John Doe", "email": "john@example.com" },
    "issuedDate": "2024-01-20T10:00:00Z",
    "expiryDate": null,
    "finalScore": 92,
    "isValid": true
  }
}
```

#### Verify Certificate (Public)
```
GET /api/admin/courses/verify/certificate?certificateNumber=CERT-2024-1234-567890

Response:
{
  "success": true,
  "data": {
    "certificateNumber": "CERT-2024-1234-567890",
    "courseName": "Python Fundamentals",
    "userName": "John Doe",
    "issuedDate": "2024-01-20T10:00:00Z",
    "finalScore": 92,
    "isValid": true
  }
}
```

---

### Admin Course Management Endpoints (Requires Admin Role)

#### Create Course
```
POST /api/admin/courses
Body:
{
  "title": "Python Fundamentals",
  "description": "Learn Python from scratch...",
  "shortDescription": "Complete Python tutorial",
  "language": "python",
  "category": "programming-language",
  "difficulty": "beginner",
  "estimatedHours": 40,
  "certificateTemplate": "standard",
  "tags": ["python", "beginner"]
}

Response:
{
  "success": true,
  "message": "Course created successfully",
  "data": { ... course details ... }
}
```

#### Update Course
```
PUT /api/admin/courses/:id
Body:
{
  "title": "Updated Title",
  "description": "Updated description",
  "difficulty": "intermediate",
  ...
}
```

#### Publish/Unpublish Course
```
PATCH /api/admin/courses/:id/publish

Response:
{
  "success": true,
  "message": "Course published",
  "data": { ... course with isPublished: true ... }
}
```

#### Delete Course
```
DELETE /api/admin/courses/:id
```

#### Add Section to Course
```
POST /api/admin/courses/:courseId/sections
Body:
{
  "title": "Getting Started",
  "description": "Introduction section"
}

Response:
{
  "success": true,
  "message": "Section added successfully",
  "data": {
    "_id": "section_id",
    "course": "course_id",
    "title": "Getting Started",
    "order": 1,
    "lessons": []
  }
}
```

#### Update Section
```
PUT /api/admin/courses/sections/:sectionId
Body:
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Section
```
DELETE /api/admin/courses/sections/:sectionId
```

#### Add Lesson to Section
```
POST /api/admin/courses/sections/:sectionId/lessons
Body:
{
  "title": "Variables and Data Types",
  "description": "Learn about variables",
  "content": "<h2>Variables</h2><p>...</p>",
  "videoUrl": "https://youtube.com/watch?v=...",
  "duration": 20,
  "difficulty": "beginner",
  "estimatedHours": 1,
  "codeExamples": [
    {
      "title": "Hello World",
      "code": 'print("Hello")',
      "expectedOutput": "Hello"
    }
  ]
}

Response:
{
  "success": true,
  "message": "Lesson added successfully",
  "data": { ... lesson details ... }
}
```

#### Update Lesson
```
PUT /api/admin/courses/lessons/:lessonId
Body:
{
  "title": "Updated Lesson",
  "content": "...",
  ...
}
```

#### Delete Lesson
```
DELETE /api/admin/courses/lessons/:lessonId
```

#### Create/Update Quiz
```
POST /api/admin/courses/:courseId/quizzes
Body:
{
  "title": "Python Basics Quiz",
  "description": "Test your knowledge",
  "type": "section-quiz",
  "sectionId": "...",
  "passingScore": 70,
  "timeLimit": 30,
  "maxRetakes": 3,
  "questions": [
    {
      "type": "multiple-choice",
      "question": "What is a variable?",
      "order": 1,
      "options": [
        { "text": "A container for data", "isCorrect": true },
        { "text": "A function", "isCorrect": false }
      ],
      "points": 1,
      "explanation": "A variable stores data values"
    },
    {
      "type": "true-false",
      "question": "True or False: Python is case-sensitive",
      "order": 2,
      "options": [
        { "text": "True", "isCorrect": true },
        { "text": "False", "isCorrect": false }
      ],
      "points": 1
    }
  ]
}

Response:
{
  "success": true,
  "message": "Quiz created successfully",
  "data": { ... quiz details ... }
}
```

#### Get Instructor's Courses
```
GET /api/admin/courses/instructor/my-courses
Query Parameters:
  - page: pagination
  - limit: results per page
  - status: "published" or "draft"

Response:
{
  "success": true,
  "data": [ ... courses ... ],
  "pagination": { ... }
}
```

---

## Question Types

### 1. Multiple Choice
```json
{
  "type": "multiple-choice",
  "question": "What is Python?",
  "options": [
    { "text": "A programming language", "isCorrect": true },
    { "text": "A snake", "isCorrect": false },
    { "text": "A film", "isCorrect": false }
  ],
  "points": 1
}
```

### 2. True/False
```json
{
  "type": "true-false",
  "question": "True or False: Python is dynamically typed",
  "options": [
    { "text": "True", "isCorrect": true },
    { "text": "False", "isCorrect": false }
  ],
  "points": 1
}
```

### 3. Short Answer
```json
{
  "type": "short-answer",
  "question": "What is the output of print(2 + 3)?",
  "acceptableAnswers": ["5"],
  "caseSensitive": false,
  "points": 1
}
```

### 4. Coding Problem
```json
{
  "type": "coding",
  "question": "Write a function to check if a number is even",
  "codingProblem": {
    "title": "Check Even Number",
    "description": "Write a function that returns True if number is even",
    "starterCode": "def is_even(n):\n    # Your code here",
    "language": "python",
    "testCases": [
      { "input": "4", "expectedOutput": "True" },
      { "input": "3", "expectedOutput": "False" }
    ]
  },
  "points": 5
}
```

---

## Usage Examples

### Example 1: Enroll and Track Progress

```javascript
// 1. Get available courses
const courses = await fetch('/api/courses?language=python&difficulty=beginner');

// 2. Enroll in a course
const enrollment = await fetch('/api/courses/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId: 'course_id' })
});

// 3. Get enrollment details
const details = await fetch('/api/courses/course_id/enrollment');

// 4. Mark lesson as complete
await fetch('/api/courses/course_id/progress/lesson', {
  method: 'PUT',
  body: JSON.stringify({
    sectionId: 'section_id',
    lessonId: 'lesson_id'
  })
});
```

### Example 2: Create Course with Content

```javascript
// 1. Create course
const course = await fetch('/api/admin/courses', {
  method: 'POST',
  body: JSON.stringify({
    title: "Python Fundamentals",
    description: "...",
    language: "python",
    category: "programming-language"
  })
});
const courseId = course.data._id;

// 2. Add section
const section = await fetch(`/api/admin/courses/${courseId}/sections`, {
  method: 'POST',
  body: JSON.stringify({
    title: "Getting Started",
    description: "Introduction"
  })
});
const sectionId = section.data._id;

// 3. Add lessons
const lesson = await fetch(`/api/admin/courses/sections/${sectionId}/lessons`, {
  method: 'POST',
  body: JSON.stringify({
    title: "Your First Program",
    content: "...",
    videoUrl: "...",
    codeExamples: [...]
  })
});

// 4. Add quiz
const quiz = await fetch(`/api/admin/courses/${courseId}/quizzes`, {
  method: 'POST',
  body: JSON.stringify({
    title: "Section Quiz",
    type: "section-quiz",
    sectionId: sectionId,
    questions: [...]
  })
});

// 5. Publish course
await fetch(`/api/admin/courses/${courseId}/publish`, {
  method: 'PATCH'
});
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common error codes:
- `400`: Bad request (missing/invalid fields)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

---

## Database Seeding

To seed initial course data:

```bash
npm run seed:courses
```

This populates the database with sample courses including:
- Python Fundamentals
- JavaScript Essentials
- C++ Programming
- Data Structures Mastery
- Algorithm Design and Analysis

---

## Future Enhancements

1. **Video Upload**: Direct video hosting instead of URLs
2. **AI-Generated Content**: Automated course generation
3. **Code Execution**: Real-time code evaluation for coding quizzes
4. **Discussion Forums**: Student interaction and collaboration
5. **Progress Analytics**: Detailed user performance metrics
6. **Payment Integration**: Paid courses and enrollment
7. **Certificates Download**: PDF certificate generation
8. **Prerequisites Enforcement**: Automatic course locking
9. **Collaborative Learning**: Study groups and peer review
10. **Mobile App**: Native mobile learning experience
