# Course System Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  • Course Browsing    • Quiz Interface    • Certificate Display │
│  • Enrollment         • Progress Tracker  • Admin Panel          │
└────────────────────────┬──────────────────────────────────────────┘
                         │ HTTP/REST
┌─────────────────────────▼──────────────────────────────────────────┐
│                    Express.js API Server                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Routes:                                                            │
│  ├─ /api/courses (public browsing)                                │
│  ├─ /api/courses/enroll (user enrollment)                         │
│  ├─ /api/admin/courses (admin management)                         │
│  └─ /api/admin/courses/quizzes (quiz submission)                  │
│                                                                     │
│  Controllers:                                                       │
│  ├─ courseController (public endpoints)                           │
│  ├─ courseAdminController (admin endpoints)                       │
│  └─ quizCertificateController (quiz & certs)                      │
│                                                                     │
│  Middleware:                                                        │
│  ├─ authMiddleware (authentication)                               │
│  └─ adminMiddleware (authorization)                               │
│                                                                     │
└────────────┬───────────────────────────────────────────────────────┘
             │ Mongoose ODM
┌────────────▼──────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Collections:                                                │  │
│  ├─ courses          (main course info)                        │  │
│  ├─ coursesections   (course sections)                         │  │
│  ├─ courselessons    (individual lessons)                      │  │
│  ├─ quizzes          (assessments)                             │  │
│  ├─ courseenrollments (user progress tracking)                │  │
│  ├─ certificates     (completion certificates)                 │  │
│  └─ users            (user profiles)                           │  │
│                                                                 │  │
└─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models Relationship Diagram

```
                    ┌──────────────────┐
                    │      User        │
                    └──────────────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
                ▼          ▼          ▼
         ┌────────────┐ ┌──────────────────┐ ┌────────────────┐
         │  Creator   │ │ Enrolled By      │ │  Certificates  │
         │  (Admin)   │ │                  │ │                │
         └────────────┘ │ CourseEnrollment │ └────────────────┘
                        │                  │
                        └──────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌────────────────┐ ┌─────────────┐ ┌─────────────┐
         │    Courses     │ │  Progress   │ │  Certificates
         │                │ │             │ │  
         └────────────────┘ └─────────────┘ └─────────────┘
                │
                │ Contains
                ▼
         ┌────────────────┐
         │ CourseSections │
         └────────────────┘
                │
                │ Contains
                ▼
         ┌────────────────┐
         │ CourseLessons  │
         └────────────────┘
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
    ┌─────────┐   ┌──────────────┐
    │ Content │   │ Code Examples│
    └─────────┘   └──────────────┘


CourseSections can have:
         │
         ▼
    ┌─────────────┐
    │    Quiz     │
    └─────────────┘
         │
         │ Contains
         ▼
    ┌─────────────┐
    │  Questions  │
    └─────────────┘
```

---

## 🔄 User Flow Diagram

### Learner Flow

```
START
  │
  ▼
┌──────────────────────┐
│ Browse All Courses   │    Filter Options:
│ (Public Endpoint)    │    • By Language
└──────────────────────┘    • By Category
  │                          • By Difficulty
  ▼
┌──────────────────────┐
│ View Course Details  │
│ (Sections & Lessons) │
└──────────────────────┘
  │
  ▼
┌──────────────────────┐
│ Click "Enroll"       │
└──────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Create CourseEnrollment      │
│ Status: active               │
│ Progress: 0%                 │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ View Course Progress         │
│ • Lessons List               │
│ • Completion Status          │
│ • Overall Progress %         │
└──────────────────────────────┘
  │
  ├─────────────────────────┐
  │                         │
  ▼                         ▼
┌──────────────┐  ┌──────────────┐
│ View Lesson  │  │ Complete     │
│ • Content    │  │ Lesson       │
│ • Code Ex.   │  │ (Mark Done)  │
│ • Resources  │  └──────────────┘
└──────────────┘          │
  │                       ▼
  │                  Progress Updated
  │                  ↓
  ▼                  Overall % recalculated
┌──────────────────────┐
│ Take Section Quiz    │
│ • See Questions      │
│ • Submit Answers     │
│ • Get Auto-Graded    │
│ • View Results +     │
│   Explanations       │
└──────────────────────┘
  │
  ├─ Pass ──────────────┐
  │                     │
  │ Fail            Continue
  │ (Can retake)        │
  │                     ▼
  │         ┌───────────────────┐
  │         │ Repeat: Lessons & │
  │         │ Quizzes           │
  │         └───────────────────┘
  │                     │
  ├─────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ All Sections Completed?      │
│ Overall Progress = 100%      │
└──────────────────────────────┘
  │ Yes
  ▼
┌──────────────────────────────┐
│ Take Final Quiz              │
│ (Course Assessment)          │
└──────────────────────────────┘
  │
  ├─ Pass ────────────┐
  │                   │
  │ Fail          SUCCESS
  │ (Can retry)       │
  │                   ▼
  └─────────────────>┌──────────────────────┐
                     │ Generate Certificate │
                     │ • Unique Number      │
                     │ • Score              │
                     │ • Issue Date         │
                     └──────────────────────┘
                             │
                             ▼
                     ┌──────────────────────┐
                     │ CourseEnrollment     │
                     │ Status: completed    │
                     │ certificateIssued: ✓ │
                     └──────────────────────┘
                             │
                             ▼
                     ┌──────────────────────┐
                     │ User Downloads       │
                     │ Certificate          │
                     └──────────────────────┘
                             │
                             ▼
                          END
```

---

## 👨‍🏫 Admin/Instructor Flow

```
START
  │
  ▼
┌──────────────────────┐
│ Admin Dashboard      │
└──────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Click "Create New Course"    │
│ Fill Form:                   │
│ • Title                      │
│ • Description                │
│ • Language                   │
│ • Category                   │
│ • Difficulty                 │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Course Created               │
│ Status: Draft (Not Published)│
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Add Sections                 │
│ • Click "Add Section"        │
│ • Enter Section Title        │
│ • Drag to Reorder            │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Add Lessons to Section       │
│ • Create Lesson              │
│ • Edit HTML Content          │
│ • Add Code Examples          │
│ • Embed Videos               │
│ • Add Resources              │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Create Section Quiz          │
│ • Add Questions              │
│   - Multiple Choice          │
│   - True/False               │
│   - Short Answer             │
│   - Coding (future)          │
│ • Set Passing Score          │
│ • Set Time Limit             │
│ • Configure Retakes          │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Repeat Sections + Lessons    │
│ for all course content       │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Create Final Quiz            │
│ (Same as Section Quiz        │
│  but type: "final-quiz")     │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Preview Course               │
│ • Check Sections             │
│ • Check Lessons              │
│ • Test Quizzes               │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Publish Course               │
│ PATCH /api/admin/courses/:id │
│ /publish                     │
│ Status: isPublished = true   │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Course Now Visible to Users  │
│ Appears in Catalog           │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Monitor Course Analytics     │
│ • View Enrollments           │
│ • Track Quiz Results         │
│ • Check Student Progress     │
│ • Monitor Completion Rates   │
└──────────────────────────────┘
  │
  ▼
┌──────────────────────────────┐
│ Edit Course (Optional)       │
│ • Update Content             │
│ • Add Sections               │
│ • Modify Quizzes             │
└──────────────────────────────┘
  │
  ▼
  END
```

---

## 📈 Database Query Patterns

### Course Discovery
```javascript
// Get published courses by language
db.courses.find({ 
  isPublished: true, 
  isArchived: false,
  language: 'python'
}).sort({ createdAt: -1 }).skip(0).limit(10)
```

### User Progress Tracking
```javascript
// Get user's enrollment with full progress
db.courseenrollments
  .findOne({ user: userId, course: courseId })
  .populate({
    path: 'sectionProgress',
    populate: 'lessons'
  })
  .populate('certificate')
```

### Quiz Statistics
```javascript
// Get top performers on a quiz
db.courseenrollments.aggregate([
  { $match: { 'sectionProgress.sectionQuizScore.quizId': quizId } },
  { $sort: { 'sectionProgress.sectionQuizScore.score': -1 } },
  { $limit: 10 }
])
```

### Course Analytics
```javascript
// Course enrollment and completion stats
db.courseenrollments.aggregate([
  { $match: { course: courseId } },
  { $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgProgress: { $avg: '$overallProgress' }
  }}
])
```

---

## 🎯 Question Types Implementation

### 1. Multiple Choice Flow
```
Question: "What is Python?"
   │
   ├─ Option A: "A snake"              isCorrect: false
   ├─ Option B: "A programming lang"   isCorrect: true
   ├─ Option C: "A movie"              isCorrect: false
   └─ Option D: "A food"               isCorrect: false
   
User Answer: Option B
   │
   ▼
Validation: "B" === "A programming lang" → Match found
   │
   ▼
Result: ✓ Correct (+1 point)
```

### 2. True/False Flow
```
Question: "Python is dynamically typed?"
   │
   ├─ Option A: "True"    isCorrect: true
   └─ Option B: "False"   isCorrect: false
   
User Answer: "True"
   │
   ▼
Validation: "True" === "True" → Match
   │
   ▼
Result: ✓ Correct (+1 point)
```

### 3. Short Answer Flow
```
Question: "What is 2 + 3?"
Acceptable Answers: ["5"]
Case Sensitive: false
   
User Answer: "5"
   │
   ▼
Normalization: "5" (no change needed)
   │
   ▼
Validation: "5" in ["5"] → Found
   │
   ▼
Result: ✓ Correct (+1 point)
```

### 4. Coding (Future)
```
Question: Write a function to find even numbers
Starter Code: def is_even(n): ...
Test Cases:
  - Input: 4, Expected: True
  - Input: 3, Expected: False
  
User Submission: Python code
   │
   ▼
Execute against test cases (future feature)
   │
   ▼
Compare outputs
   │
   ▼
Result: Pass/Fail
```

---

## 💾 Progress Calculation Algorithm

```
┌─────────────────────────────────────────┐
│ Calculate Overall Course Progress       │
└─────────────────────────────────────────┘

1. Get all sections for course
   sections = Course.find(id).sections

2. Get user's enrollment
   enrollment = CourseEnrollment.find(userId, courseId)

3. For each section:
   total_lessons += Section.lessons.count()
   
4. For each enrolled section progress:
   completed_lessons += LessonProgress.filter(isCompleted=true).count()

5. Overall Progress = (completed_lessons / total_lessons) * 100

Example:
  Course has 3 sections
  ├─ Section 1: 2 lessons (both completed) ✓✓
  ├─ Section 2: 3 lessons (2 completed)    ✓✓✗
  └─ Section 3: 2 lessons (none completed) ✗✗
  
  Total Lessons = 7
  Completed Lessons = 4
  Progress = (4 / 7) * 100 = 57.14%
```

---

## 🎓 Certificate Generation Process

```
┌───────────────────────────────────────────┐
│ User Completes Final Quiz & Passes        │
└───────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│ Check:                                    │
│ • finalQuizScore.passed = true ✓          │
│ • certificateIssued = false               │
└───────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│ Generate Certificate:                     │
│ • Generate unique number: CERT-2024-...   │
│ • Set user, course, enrollment refs       │
│ • Record final score                      │
│ • Set issued date = now                   │
│ • isValid = true                          │
└───────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│ Update Enrollment:                        │
│ • status = "completed"                    │
│ • certificateIssued = true                │
│ • certificate ref = cert._id              │
│ • completionDate = now                    │
└───────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────┐
│ Certificate Ready for:                    │
│ • Download                                │
│ • Public Verification                     │
│ • User Profile Display                    │
└───────────────────────────────────────────┘
```

---

## 📋 Response Status Codes

```
┌─────┬──────────────────────┬─────────────────────────────────┐
│Code │ Meaning              │ When Returned                   │
├─────┼──────────────────────┼─────────────────────────────────┤
│200  │ OK                   │ Successful operation            │
│201  │ Created              │ New resource created            │
│400  │ Bad Request          │ Missing/invalid fields          │
│401  │ Unauthorized         │ Not logged in/invalid token     │
│403  │ Forbidden            │ Insufficient permissions        │
│404  │ Not Found            │ Resource doesn't exist          │
│409  │ Conflict             │ Already enrolled/exists         │
│500  │ Server Error         │ Internal server error           │
└─────┴──────────────────────┴─────────────────────────────────┘
```

---

## 🔐 Authorization Flow

```
User Request
   │
   ▼
┌─────────────────────────┐
│ Check Authentication    │
│ Verify JWT Token        │
└─────────────────────────┘
   │
   ├─ No Token/Invalid ──→ 401 Unauthorized
   │
   ├─ Valid ────────────┐
   │                    ▼
   │         ┌──────────────────────┐
   │         │ Check Authorization  │
   │         │ Check User Role      │
   │         └──────────────────────┘
   │              │
   │              ├─ Admin Endpoint
   │              │  & Role ≠ admin ──→ 403 Forbidden
   │              │
   │              ├─ Resource Owner
   │              │  Check ──────────→ 403 Forbidden
   │              │
   │              └─ All Checks Pass
   │                      │
   │                      ▼
   │         ┌──────────────────────┐
   │         │ Execute Endpoint     │
   │         │ Return Result        │
   │         └──────────────────────┘
   │
   └──→ 200 OK / 201 Created
```

---

## 🗂️ File Organization

```
src/
├── models/                      [6 NEW MODELS]
│   ├── Course.js
│   ├── CourseSection.js
│   ├── CourseLesson.js
│   ├── Quiz.js
│   ├── CourseEnrollment.js
│   └── Certificate.js
│
├── controllers/                 [3 NEW CONTROLLERS]
│   ├── courseController.js
│   ├── courseAdminController.js
│   └── quizCertificateController.js
│
├── routes/                      [2 NEW ROUTES]
│   ├── courseRoutes.js
│   └── adminCourseRoutes.js
│
├── utils/
│   └── courseSeedData.js        [NEW - SEED DATA]
│
└── app.js                       [MODIFIED - ROUTES ADDED]

scripts/
└── seedCourses.js              [NEW - SEED SCRIPT]

docs/
├── Course_System_API_Doc.md                    [NEW]
├── Course_System_Implementation_Guide.md       [NEW]
├── Frontend_Course_Integration_Guide.md        [NEW]
└── IMPLEMENTATION_SUMMARY.md                   [NEW]
```

---

## 🚀 Deployment Checklist

- [ ] All models created and indexed
- [ ] All controllers implemented
- [ ] All routes registered in app.js
- [ ] Error handling in place
- [ ] Authentication middleware working
- [ ] Admin middleware configured
- [ ] Seed script runs successfully
- [ ] API endpoints tested
- [ ] Documentation complete
- [ ] Frontend integration guide provided
- [ ] Code quality verified
- [ ] Performance optimized
- [ ] Security validated
- [ ] Ready for production

---

This architecture provides a solid foundation for CodeHub's learning platform with room for future enhancements!
