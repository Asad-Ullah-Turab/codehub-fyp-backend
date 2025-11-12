# 🚀 Quick Start Guide - CodeHub Course System

## 5-Minute Setup

### 1. Prerequisites
- MongoDB running locally or connection string available
- Node.js and npm installed
- Backend application running on `localhost:5000` (or your configured port)

### 2. Start Backend
```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Output should show: "CodeHub Backend API 🚀"
```

### 3. Seed Initial Courses
```bash
npm run seed:courses

# Output:
# 🌱 Seeding courses...
# ✅ Admin user created
# ✅ Python Course created with sections and lessons
# ✅ JavaScript Course created
# ✅ C++ Course created
# ✅ Data Structures Course created
# ✅ Algorithms Course created
# ✨ All courses seeded successfully!
```

### 4. Verify Installation
```bash
# Open in browser or use curl
curl http://localhost:5000/api/courses

# Should return list of courses with HTTP 200
```

---

## 📚 Sample API Calls (Postman/Curl)

### Get All Courses
```bash
curl http://localhost:5000/api/courses
```

### Filter by Language
```bash
curl "http://localhost:5000/api/courses/language/python"
```

### Filter by Difficulty
```bash
curl "http://localhost:5000/api/courses?difficulty=beginner&page=1&limit=10"
```

### Get Single Course
```bash
curl http://localhost:5000/api/courses/{courseId}
```

### Enroll in Course (Requires Auth Token)
```bash
curl -X POST http://localhost:5000/api/courses/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"courseId": "COURSE_ID_HERE"}'
```

### Get User's Enrolled Courses
```bash
curl http://localhost:5000/api/courses/user/enrolled \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Enrollment Details
```bash
curl http://localhost:5000/api/courses/{courseId}/enrollment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Mark Lesson as Complete
```bash
curl -X PUT http://localhost:5000/api/courses/{courseId}/progress/lesson \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "sectionId": "SECTION_ID",
    "lessonId": "LESSON_ID"
  }'
```

### Get Quiz Details
```bash
curl http://localhost:5000/api/admin/courses/quizzes/{quizId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Submit Quiz Answers
```bash
curl -X POST http://localhost:5000/api/admin/courses/quizzes/{quizId}/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "courseId": "COURSE_ID",
    "sectionId": "SECTION_ID",
    "answers": {
      "QUESTION_ID_1": "Your answer",
      "QUESTION_ID_2": "Your answer"
    }
  }'
```

### Get User Certificates
```bash
curl http://localhost:5000/api/admin/courses/user/certificates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Verify Certificate (Public)
```bash
curl "http://localhost:5000/api/admin/courses/verify/certificate?certificateNumber=CERT-2024-1234-567890"
```

---

## 🛠️ Admin Operations

### Login as Admin
First, get an auth token by signing up or logging in as admin user.

### Create a New Course
```bash
curl -X POST http://localhost:5000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "React Fundamentals",
    "description": "Learn React from scratch",
    "shortDescription": "Complete React tutorial",
    "language": "javascript",
    "category": "web-development",
    "difficulty": "beginner",
    "estimatedHours": 30,
    "tags": ["react", "javascript", "web"]
  }'

# Response will include courseId
```

### Add Section to Course
```bash
curl -X POST http://localhost:5000/api/admin/courses/{courseId}/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Getting Started with React",
    "description": "Introduction section"
  }'

# Response will include sectionId
```

### Add Lesson to Section
```bash
curl -X POST http://localhost:5000/api/admin/courses/sections/{sectionId}/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "JSX Basics",
    "description": "Learn JSX syntax",
    "content": "<h2>JSX</h2><p>JSX allows you to write HTML in JavaScript...</p>",
    "duration": 20,
    "difficulty": "beginner",
    "estimatedHours": 1,
    "codeExamples": [
      {
        "title": "Hello JSX",
        "code": "const element = <h1>Hello, world!</h1>;",
        "expectedOutput": "Renders h1 element"
      }
    ]
  }'

# Response will include lessonId
```

### Create Quiz for Section
```bash
curl -X POST http://localhost:5000/api/admin/courses/{courseId}/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "React Basics Quiz",
    "type": "section-quiz",
    "sectionId": "SECTION_ID",
    "passingScore": 70,
    "timeLimit": 30,
    "maxRetakes": 3,
    "questions": [
      {
        "type": "multiple-choice",
        "question": "What does JSX stand for?",
        "order": 1,
        "options": [
          {"text": "JavaScript XML", "isCorrect": true},
          {"text": "JavaScript Extra", "isCorrect": false},
          {"text": "Java Syntax Extension", "isCorrect": false}
        ],
        "points": 1,
        "explanation": "JSX stands for JavaScript XML"
      },
      {
        "type": "true-false",
        "question": "True or False: React requires a build step",
        "order": 2,
        "options": [
          {"text": "True", "isCorrect": true},
          {"text": "False", "isCorrect": false}
        ],
        "points": 1
      }
    ]
  }'
```

### Publish Course
```bash
curl -X PATCH http://localhost:5000/api/admin/courses/{courseId}/publish \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Course now visible to all users
```

### View My Courses (Instructor)
```bash
curl "http://localhost:5000/api/admin/courses/instructor/my-courses?status=published" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 📊 Common Workflows

### Complete Workflow: Learner Path

1. **Browse Courses**
   ```bash
   # Get all beginner courses in Python
   curl "http://localhost:5000/api/courses?language=python&difficulty=beginner"
   ```

2. **View Course Details**
   ```bash
   # See sections, lessons, and quizzes
   curl http://localhost:5000/api/courses/{courseId}
   ```

3. **Enroll**
   ```bash
   curl -X POST http://localhost:5000/api/courses/enroll \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"courseId": "..."}'
   ```

4. **View Progress**
   ```bash
   curl http://localhost:5000/api/courses/{courseId}/enrollment \
     -H "Authorization: Bearer TOKEN"
   ```

5. **Complete Lesson**
   ```bash
   curl -X PUT http://localhost:5000/api/courses/{courseId}/progress/lesson \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"sectionId": "...", "lessonId": "..."}'
   ```

6. **Take Quiz**
   ```bash
   curl http://localhost:5000/api/admin/courses/quizzes/{quizId} \
     -H "Authorization: Bearer TOKEN"
   ```

7. **Submit Quiz**
   ```bash
   curl -X POST http://localhost:5000/api/admin/courses/quizzes/{quizId}/submit \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"courseId": "...", "answers": {...}}'
   ```

8. **Get Certificate**
   ```bash
   # After passing final quiz
   curl http://localhost:5000/api/admin/courses/user/certificates \
     -H "Authorization: Bearer TOKEN"
   ```

---

## 🗂️ File Locations

### Models
- `src/models/Course.js` - Main course
- `src/models/CourseSection.js` - Course sections
- `src/models/CourseLesson.js` - Individual lessons
- `src/models/Quiz.js` - Assessment quizzes
- `src/models/CourseEnrollment.js` - User progress
- `src/models/Certificate.js` - Certificates

### Controllers
- `src/controllers/courseController.js` - Public user endpoints
- `src/controllers/courseAdminController.js` - Admin endpoints
- `src/controllers/quizCertificateController.js` - Quiz & certs

### Routes
- `src/routes/courseRoutes.js` - User routes
- `src/routes/adminCourseRoutes.js` - Admin routes

### Documentation
- `docs/Course_System_API_Doc.md` - Full API reference
- `docs/Course_System_Implementation_Guide.md` - Technical guide
- `docs/Frontend_Course_Integration_Guide.md` - Frontend guide
- `docs/ARCHITECTURE_OVERVIEW.md` - Architecture & diagrams
- `docs/IMPLEMENTATION_SUMMARY.md` - Complete summary

### Seed Data
- `src/utils/courseSeedData.js` - Sample courses
- `scripts/seedCourses.js` - Seed script

---

## 🧪 Testing the System

### Manual Testing Checklist

- [ ] **Browse Courses**
  - [ ] Get all courses
  - [ ] Filter by language
  - [ ] Filter by difficulty
  - [ ] Check pagination

- [ ] **Enrollment**
  - [ ] Enroll in course
  - [ ] View enrolled courses
  - [ ] Check enrollment details

- [ ] **Progress Tracking**
  - [ ] Mark lesson complete
  - [ ] Check progress updates
  - [ ] Verify percentage calculation

- [ ] **Quizzes**
  - [ ] Get quiz details
  - [ ] Submit quiz (pass)
  - [ ] Submit quiz (fail)
  - [ ] Check answer explanations
  - [ ] Verify auto-grading

- [ ] **Certificates**
  - [ ] Verify certificate generated on completion
  - [ ] Get user certificates
  - [ ] Verify certificate (public)

- [ ] **Admin Functions**
  - [ ] Create course
  - [ ] Add sections
  - [ ] Add lessons
  - [ ] Create quizzes
  - [ ] Publish course

---

## 🐛 Troubleshooting

### Issue: "MongoDB connection failed"
**Solution**: Ensure MongoDB is running
```bash
# macOS with Homebrew
brew services start mongodb-community

# or run MongoDB in Docker
docker run -d -p 27017:27017 mongo
```

### Issue: "Cannot find module"
**Solution**: Install dependencies
```bash
npm install
```

### Issue: "Port 5000 already in use"
**Solution**: Change port in `.env` or kill existing process
```bash
# Change PORT in .env
PORT=5001

# or kill the process
# On Windows: netstat -ano | findstr :5000
# On Mac/Linux: lsof -i :5000
```

### Issue: "Auth token invalid"
**Solution**: Get valid token
1. Sign up/login first to get token
2. Use token in Authorization header
3. Ensure token hasn't expired

### Issue: "Unauthorized to perform action"
**Solution**: Check permissions
- Ensure you're logged in as admin
- Check that user has correct role
- Verify authorization headers

---

## 📱 Example Frontend Integration

### React Component Example
```typescript
import React, { useState, useEffect } from 'react';

interface Course {
  _id: string;
  title: string;
  shortDescription: string;
  language: string;
}

export const CourseCatalog: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Fetch courses
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data.data));
  }, []);

  return (
    <div className="courses-grid">
      {courses.map(course => (
        <div key={course._id} className="course-card">
          <h3>{course.title}</h3>
          <p>{course.shortDescription}</p>
          <button>Enroll Now</button>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎯 Next Steps

1. **Start Backend** → `npm run dev`
2. **Seed Data** → `npm run seed:courses`
3. **Test API** → Use curl/Postman examples above
4. **Build Frontend** → Follow `Frontend_Course_Integration_Guide.md`
5. **Deploy** → Deploy to production

---

## 📞 Documentation Reference

| Document | Purpose |
|----------|---------|
| Course_System_API_Doc.md | Complete API reference |
| Course_System_Implementation_Guide.md | Technical implementation details |
| Frontend_Course_Integration_Guide.md | Frontend integration guide |
| ARCHITECTURE_OVERVIEW.md | System architecture & diagrams |
| IMPLEMENTATION_SUMMARY.md | Project summary |
| QUICK_START.md | This file |

---

## ✅ Success Indicators

You'll know everything is working when:
- ✅ `npm run dev` starts without errors
- ✅ `npm run seed:courses` completes successfully
- ✅ `curl http://localhost:5000/api/courses` returns course list
- ✅ Can enroll in courses (with auth token)
- ✅ Progress tracking updates correctly
- ✅ Quizzes grade automatically
- ✅ Certificates generate on completion

---

**Version**: 1.0
**Last Updated**: November 13, 2025
**Status**: Ready for Production ✅
