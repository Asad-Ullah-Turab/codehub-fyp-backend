# Course System - Frontend Integration Guide

## Overview
This guide helps frontend developers integrate the CodeHub Course Management System into the React/TypeScript frontend.

---

## Course Browsing & Discovery

### 1. Display Course Catalog
```typescript
// Fetch all published courses
const fetchCourses = async (filters?: {
  language?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/courses?${params}`);
  return response.json();
};

// Usage
const courses = await fetchCourses({
  language: 'python',
  difficulty: 'beginner',
  page: 1,
  limit: 10
});
```

### 2. Course Detail Page
```typescript
const fetchCourseDetails = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  const data = await response.json();
  
  // data.data = full course details
  // data.enrollment = user's enrollment (if authenticated & enrolled)
  return data;
};
```

### 3. Filter Courses by Language
```typescript
const fetchCoursesByLanguage = async (
  language: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await fetch(
    `/api/courses/language/${language}?page=${page}&limit=${limit}`
  );
  return response.json();
};

// Languages available: python, cpp, javascript, sql, rust, haskell
// Categories: programming-language, data-structures, algorithms
```

---

## Enrollment Management

### 1. Enroll in Course
```typescript
const enrollCourse = async (courseId: string, authToken: string) => {
  const response = await fetch('/api/courses/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ courseId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to enroll');
  }
  
  return response.json();
};
```

### 2. Get User's Enrolled Courses
```typescript
const fetchUserCourses = async (
  authToken: string,
  status?: 'active' | 'completed' | 'dropped' | 'on-hold',
  page: number = 1,
  limit: number = 10
) => {
  let url = `/api/courses/user/enrolled?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  return response.json();
};
```

### 3. Get Enrollment with Full Progress
```typescript
const fetchEnrollmentDetails = async (
  courseId: string,
  authToken: string
) => {
  const response = await fetch(
    `/api/courses/${courseId}/enrollment`,
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );
  
  return response.json();
};

// Response includes:
// - course details
// - enrollment status
// - section progress (with completed lessons)
// - quiz scores
// - overall progress percentage
// - certificates
```

---

## Progress Tracking

### Mark Lesson as Complete
```typescript
const completeLessonProgress = async (
  courseId: string,
  sectionId: string,
  lessonId: string,
  authToken: string
) => {
  const response = await fetch(
    `/api/courses/${courseId}/progress/lesson`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        sectionId,
        lessonId
      })
    }
  );
  
  return response.json();
};

// Call this when user finishes watching/reading a lesson
```

### Track Progress Display
```typescript
interface CourseProgress {
  overallProgress: number;        // 0-100
  sectionProgress: {
    section: string;              // section ID
    isCompleted: boolean;
    lessons: {
      lesson: string;
      isCompleted: boolean;
      completedAt?: Date;
    }[];
    sectionQuizScore?: {
      score: number;              // percentage
      passed: boolean;
    };
  }[];
}

// Display progress bar
<div className="progress-bar">
  <div 
    className="progress-fill" 
    style={{ width: `${enrollment.overallProgress}%` }}
  >
    {enrollment.overallProgress}%
  </div>
</div>
```

---

## Quiz System

### 1. Get Quiz Details
```typescript
const fetchQuizDetails = async (quizId: string, authToken: string) => {
  const response = await fetch(`/api/admin/courses/quizzes/${quizId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  return response.json();
};

// Response includes:
// - quiz details (title, timeLimit, passingScore)
// - questions with options
// - previousScore (if taken before)
// - canRetake (boolean)
```

### 2. Quiz Interface Component
```typescript
interface Quiz {
  _id: string;
  title: string;
  type: 'section-quiz' | 'final-quiz' | 'practice-quiz';
  questions: Question[];
  passingScore: number;
  timeLimit: number;        // minutes (0 = no limit)
  totalPoints: number;
  maxRetakes: number;
  showAnswerExplanation: boolean;
}

interface Question {
  _id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'coding';
  question: string;
  description?: string;
  order: number;
  options?: { text: string; isCorrect?: boolean }[];
  acceptableAnswers?: string[];
  codingProblem?: {
    title: string;
    description: string;
    starterCode: string;
    language: string;
    testCases: { input: string; expectedOutput: string }[];
  };
  points: number;
  explanation: string;
}
```

### 3. Submit Quiz Answers
```typescript
const submitQuizAnswers = async (
  quizId: string,
  courseId: string,
  sectionId: string | null,
  answers: Record<string, string>,  // questionId -> answer
  authToken: string
) => {
  const response = await fetch(
    `/api/admin/courses/quizzes/${quizId}/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        courseId,
        sectionId,
        answers
      })
    }
  );
  
  return response.json();
};

// Response includes:
// - score (percentage)
// - passed (boolean)
// - attemptCount
// - results (per question: correct/incorrect with explanation)
// - certificate (if final quiz & passed)
```

### 4. Display Quiz Results
```typescript
interface QuizResult {
  questionId: string;
  question: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
  points: number;
}

// Show results
<div className="quiz-results">
  <h2>Quiz Results</h2>
  <p>Score: {score}% (Passing: {passingScore}%)</p>
  {passed && <p className="pass">✓ Passed!</p>}
  {!passed && <p className="fail">✗ Failed</p>}
  
  {results.map(result => (
    <div key={result.questionId} className={`question ${result.isCorrect ? 'correct' : 'incorrect'}`}>
      <p><strong>{result.question}</strong></p>
      <p>Your answer: {result.userAnswer}</p>
      <p className="explanation">{result.explanation}</p>
    </div>
  ))}
</div>
```

### 5. Get Quiz Leaderboard
```typescript
const fetchQuizLeaderboard = async (
  quizId: string,
  authToken: string,
  limit: number = 10
) => {
  const response = await fetch(
    `/api/admin/courses/quizzes/${quizId}/leaderboard?limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );
  
  return response.json();
};

// Response includes top performers with scores
```

---

## Certificates

### 1. Get User's Certificates
```typescript
const fetchUserCertificates = async (
  authToken: string,
  page: number = 1,
  limit: number = 10
) => {
  const response = await fetch(
    `/api/admin/courses/user/certificates?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );
  
  return response.json();
};

interface Certificate {
  _id: string;
  certificateNumber: string;
  course: { title: string; language: string; category: string };
  issuedDate: Date;
  finalScore: number;
  isValid: boolean;
}
```

### 2. Display Certificate
```typescript
const fetchCertificateDetails = async (
  certificateId: string,
  authToken: string
) => {
  const response = await fetch(
    `/api/admin/courses/certificates/${certificateId}`,
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );
  
  return response.json();
};

// Display in modal/page
<div className="certificate">
  <h1>Certificate of Completion</h1>
  <p>This is to certify that</p>
  <p className="name">{certificate.user.name}</p>
  <p>has successfully completed</p>
  <p className="course">{certificate.course.title}</p>
  <p className="score">with a score of {certificate.finalScore}%</p>
  <p>Certificate Number: {certificate.certificateNumber}</p>
  <p>Issued: {new Date(certificate.issuedDate).toLocaleDateString()}</p>
</div>
```

### 3. Verify Certificate (Public)
```typescript
const verifyCertificate = async (certificateNumber: string) => {
  const response = await fetch(
    `/api/admin/courses/verify/certificate?certificateNumber=${certificateNumber}`
  );
  
  if (!response.ok) {
    return { success: false, message: 'Certificate not found or invalid' };
  }
  
  return response.json();
};

// Can be used in a public verification page
```

---

## Learning Path Components

### 1. Course Overview Card
```typescript
interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    shortDescription: string;
    language: string;
    category: string;
    difficulty: string;
    estimatedHours: number;
    enrollmentCount: number;
    averageRating: number;
    thumbnail?: string;
  };
  isEnrolled?: boolean;
  onEnroll: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isEnrolled, onEnroll }) => (
  <div className="course-card">
    {course.thumbnail && <img src={course.thumbnail} alt={course.title} />}
    <h3>{course.title}</h3>
    <p>{course.shortDescription}</p>
    <div className="course-meta">
      <span className="difficulty">{course.difficulty}</span>
      <span className="language">{course.language}</span>
      <span className="hours">~{course.estimatedHours}h</span>
    </div>
    <button
      onClick={() => onEnroll(course._id)}
      disabled={isEnrolled}
    >
      {isEnrolled ? 'Enrolled' : 'Enroll Now'}
    </button>
  </div>
);
```

### 2. Course Content Navigation
```typescript
interface CourseContentProps {
  course: any;
  enrollment: any;
  onSelectLesson: (lessonId: string) => void;
  onCompleteLesson: (lessonId: string, sectionId: string) => void;
}

const CourseContent: React.FC<CourseContentProps> = ({
  course,
  enrollment,
  onSelectLesson,
  onCompleteLesson
}) => {
  const sectionProgress = enrollment.sectionProgress || [];

  return (
    <div className="course-content">
      <h2>Course Content</h2>
      {course.sections.map((section: any) => {
        const progress = sectionProgress.find(
          (sp: any) => sp.section === section._id
        );
        
        return (
          <div key={section._id} className="section">
            <h3>{section.title}</h3>
            <div className="lessons">
              {section.lessons.map((lesson: any) => {
                const isCompleted = progress?.lessons.some(
                  (l: any) => l.lesson === lesson._id && l.isCompleted
                );
                
                return (
                  <div
                    key={lesson._id}
                    className={`lesson ${isCompleted ? 'completed' : ''}`}
                  >
                    <span onClick={() => onSelectLesson(lesson._id)}>
                      {lesson.title}
                    </span>
                    {!isCompleted && (
                      <button
                        onClick={() =>
                          onCompleteLesson(lesson._id, section._id)
                        }
                      >
                        Mark Complete
                      </button>
                    )}
                    {isCompleted && <span className="check">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

### 3. Progress Tracker
```typescript
interface ProgressTrackerProps {
  enrollment: any;
  course: any;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  enrollment,
  course
}) => (
  <div className="progress-tracker">
    <h3>Progress</h3>
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${enrollment.overallProgress}%` }}
      />
    </div>
    <p>{enrollment.overallProgress}% complete</p>
    
    <div className="stats">
      <div className="stat">
        <h4>Sections</h4>
        <p>
          {
            enrollment.sectionProgress.filter(
              (sp: any) => sp.isCompleted
            ).length
          }
          / {course.sections.length}
        </p>
      </div>
      <div className="stat">
        <h4>Study Time</h4>
        <p>{enrollment.totalTimeSpentMinutes} minutes</p>
      </div>
    </div>
  </div>
);
```

---

## Admin Panel Components

### 1. Create Course Form
```typescript
const CreateCourseForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    shortDescription: '',
    language: 'python',
    category: 'programming-language',
    difficulty: 'beginner',
    estimatedHours: 0,
    tags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const data = await response.json();
      // Redirect to course editor
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Course Title"
        required
      />
      {/* Other fields */}
      <button type="submit">Create Course</button>
    </form>
  );
};
```

### 2. Course Management Dashboard
```typescript
const InstructorDashboard: React.FC = () => {
  const [courses, setCourses] = React.useState([]);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    fetchInstructorCourses(
      authToken,
      filter === 'published' ? 'published' : filter === 'draft' ? 'draft' : undefined
    ).then(setCourses);
  }, [filter]);

  return (
    <div className="instructor-dashboard">
      <h2>My Courses</h2>
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'published' ? 'active' : ''}
          onClick={() => setFilter('published')}
        >
          Published
        </button>
        <button
          className={filter === 'draft' ? 'active' : ''}
          onClick={() => setFilter('draft')}
        >
          Draft
        </button>
      </div>
      
      {courses.data?.map((course: any) => (
        <div key={course._id} className="course-item">
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <div className="actions">
            <button onClick={() => editCourse(course._id)}>Edit</button>
            <button onClick={() => publishCourse(course._id)}>
              {course.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => deleteCourse(course._id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Error Handling

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

const handleApiError = (error: any) => {
  if (error.response?.data?.message) {
    // API error
    console.error(error.response.data.message);
    return error.response.data.message;
  } else if (error.message) {
    // Network/other error
    console.error(error.message);
    return error.message;
  }
  return 'An unknown error occurred';
};

// Usage
try {
  const response = await enrollCourse(courseId, authToken);
  if (response.success) {
    // Handle success
  }
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

---

## Hooks for Reusability

```typescript
// useCourse.ts
export const useCourse = (courseId: string) => {
  const [course, setCourse] = React.useState(null);
  const [enrollment, setEnrollment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCourseDetails(courseId);
      setCourse(data.data);
      setEnrollment(data.enrollment);
      setLoading(false);
    };
    fetchData();
  }, [courseId]);

  return { course, enrollment, loading };
};

// useCourseProgress.ts
export const useCourseProgress = (
  courseId: string,
  authToken: string
) => {
  const [enrollment, setEnrollment] = React.useState(null);

  const completeLesson = React.useCallback(
    async (sectionId: string, lessonId: string) => {
      const data = await completeLessonProgress(
        courseId,
        sectionId,
        lessonId,
        authToken
      );
      setEnrollment(data.data);
    },
    [courseId, authToken]
  );

  return { enrollment, completeLesson };
};
```

---

## UI Examples Layout

### Course Catalog Page
```
┌─────────────────────────────────────┐
│  Courses > Filter by Language       │
├─────────────────────────────────────┤
│ [Python] [JavaScript] [C++] [SQL]   │
│ [Rust] [Haskell]                   │
├─────────────────────────────────────┤
│                                     │
│ ┌──────────┐ ┌──────────┐          │
│ │ Course 1 │ │ Course 2 │          │
│ │ [Image]  │ │ [Image]  │          │
│ │ Title    │ │ Title    │          │
│ │ Desc...  │ │ Desc...  │          │
│ │ ⭐4.5    │ │ ⭐4.8    │          │
│ │ [Enroll] │ │ [Enroll] │          │
│ └──────────┘ └──────────┘          │
│                                     │
└─────────────────────────────────────┘
```

### Learning Page
```
┌──────────────────────────────┬─────────────────┐
│  Python Fundamentals         │  Progress: 45%  │
│  Getting Started             │  ▓▓▓▓░░░░░░░░░ │
├──────────────────────────────┤─────────────────┤
│ Section 1                    │ Est. 2h 30m     │
│ • Your First Program  ✓      │ Time: 1h 45m    │
│ • Variables & Types   ✓      │ Status: Active  │
│ • Comments & Syntax          │                 │
│ • Data Types Quiz [Take]     │ [Take Quiz]     │
│                              │ [View Results]  │
│ Section 2                    │                 │
│ • If Statements      ✓       │ [Certificate]   │
│ • Loops & Iteration          │                 │
│ • Practice Problems          │                 │
│ • Control Flow Quiz [Take]   │                 │
└──────────────────────────────┴─────────────────┘
```

---

## Type Definitions

```typescript
// types/course.ts
export interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  language: 'python' | 'cpp' | 'javascript' | 'sql' | 'rust' | 'haskell';
  category:
    | 'programming-language'
    | 'data-structures'
    | 'algorithms'
    | 'web-development'
    | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructor: User;
  sections: Section[];
  finalQuiz?: Quiz;
  enrollmentCount: number;
  averageRating: number;
  isPublished: boolean;
  tags: string[];
  thumbnail?: string;
  estimatedHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  _id: string;
  course: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  sectionQuiz?: Quiz;
  estimatedHours: number;
}

export interface Lesson {
  _id: string;
  section: string;
  title: string;
  description: string;
  content: string;
  order: number;
  videoUrl?: string;
  duration: number;
  codeExamples: CodeExample[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

export interface CourseEnrollment {
  _id: string;
  user: string;
  course: string;
  status: 'active' | 'completed' | 'dropped' | 'on-hold';
  sectionProgress: SectionProgress[];
  overallProgress: number;
  finalQuizScore?: QuizScore;
  totalTimeSpentMinutes: number;
  certificate?: Certificate;
  certificateIssued: boolean;
  enrollmentDate: Date;
  completionDate?: Date;
}

export interface SectionProgress {
  section: string;
  isCompleted: boolean;
  completedAt?: Date;
  lessons: LessonProgress[];
  sectionQuizScore?: QuizScore;
  timeSpentMinutes: number;
}

export interface QuizScore {
  quizId: string;
  score: number;
  maxScore: number;
  attemptCount: number;
  lastAttemptAt: Date;
  passed: boolean;
}

export interface Certificate {
  _id: string;
  certificateNumber: string;
  user: string;
  course: string;
  issuedDate: Date;
  finalScore: number;
  isValid: boolean;
}
```

---

## Quick Integration Checklist

- [ ] Setup TypeScript types from course system
- [ ] Create course browsing/discovery pages
- [ ] Implement enrollment functionality
- [ ] Build course player/lesson viewer
- [ ] Create progress tracker component
- [ ] Implement quiz system UI
- [ ] Add certificate display and verification
- [ ] Build admin panel for course creation
- [ ] Add proper error handling and loading states
- [ ] Setup authentication/authorization
- [ ] Test all API endpoints
- [ ] Add responsive design
- [ ] Setup state management (Redux/Context)
- [ ] Add notifications/toasts

---

This guide should provide everything needed to integrate the course system into your React frontend!
