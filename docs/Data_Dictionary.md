# CodeHub Data Dictionary

## 4.3.1 Data Dictionary

### 4.3.1.1 AIChat

**Description:** Stores the conversation history between a user and the AI chatbot, including context information about what content the user is studying.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| message | String | required: true. The user's message to the AI. |
| response | String | required: true. The AI's response. |
| context | String | default: 'general'. Enum: ["general", "course", "tutorial"] |
| contextTitle | String | The title of the course/tutorial being discussed. |
| contextId | String | The ID of the course/tutorial being discussed. |
| contentScope | String | The specific content being studied. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.2 Analytics

**Description:** Represents a snapshot of system-wide analytics data for the admin dashboard.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| date | Date | default: Date.now |
| activeUsers | Number | default: 0. Count of active users. |
| newSignups | Number | default: 0. Count of new user registrations. |
| totalTutorials | Number | default: 0. Total number of tutorials. |
| feedbackCount | Number | default: 0. Total feedback submissions. |
| mostViewedTutorials | [ObjectId] | Ref: 'Tutorial'. Array of most viewed tutorial IDs. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.3 Certificate

**Description:** Represents a certificate issued to a user upon successfully completing a course.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| course | ObjectId | Ref: 'Course', required: true |
| enrollment | ObjectId | Ref: 'CourseEnrollment', required: true |
| certificateNumber | String | unique: true, required: true. Auto-generated unique certificate identifier. |
| issuedDate | Date | default: Date.now. When the certificate was issued. |
| expiryDate | Date | default: null. null = no expiry. |
| finalScore | Number | required: true. The user's final score in the course. |
| certificateURL | String | default: null. URL to certificate document. |
| template | String | default: "standard". The certificate design template. |
| isValid | Boolean | default: true. Whether the certificate is currently valid. |
| approvalStatus | String | default: "pending", Enum: ["pending", "approved", "rejected"] |
| approvedBy | ObjectId | Ref: 'User', default: null. Admin who approved the certificate. |
| approvalDate | Date | default: null. When the certificate was approved. |
| rejectionReason | String | default: null. Reason if certificate was rejected. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.4 CodeChat

**Description:** Stores conversation history between a user and the code assistant AI, including code context and error information.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| message | String | required: true. The user's message/question. |
| response | String | required: true. The AI's response. |
| messageType | String | default: 'question', Enum: ["question", "error-help", "problem-help", "regular"] |
| code | String | The code context when the message was sent. |
| language | String | default: 'python'. Programming language of the code. |
| error | String | Any error message being discussed. |
| problems | [Object] | Array of code problems/issues. |
| problems.severity | String | Enum: ["error", "warning", "info"] |
| problems.message | String | Description of the problem. |
| problems.line | Number | Line number where problem occurs. |
| problems.column | Number | Column number where problem occurs. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.5 CodeSnippet

**Description:** Stores code snippets saved or shared by users from the code editor.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| owner | ObjectId | Ref: 'User', required: true |
| title | String | default: "Untitled Code" |
| language | String | required: true (e.g., "python", "cpp", "javascript") |
| code | String | required: true. The actual code content. |
| output | String | Stores the last execution output. |
| sharedLink | String | default: null. Unique shareable link. |
| isPublic | Boolean | default: false. Whether the snippet is publicly viewable. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.6 Contact

**Description:** Represents a contact form submission from users or visitors.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| fullName | String | required: true, trim: true, minlength: 2, maxlength: 100 |
| email | String | required: true, trim: true, lowercase: true, Validator: email format |
| subject | String | required: true, trim: true, minlength: 5, maxlength: 200 |
| message | String | required: true, trim: true, minlength: 10, maxlength: 2000 |
| status | String | default: "pending", Enum: ["pending", "in-progress", "resolved", "closed", "replied"] |
| userId | ObjectId | Ref: 'User', default: null. If user is logged in. |
| ipAddress | String | trim: true. IP address of submitter. |
| userAgent | String | trim: true. Browser/device information. |
| response | String | trim: true. Admin's response to the contact message. |
| respondedAt | Date | When the admin responded. |
| respondedBy | ObjectId | Ref: 'User'. Admin who responded. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.7 Course

**Description:** Represents a structured learning course containing multiple sections, lessons, and assessments.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| title | String | required: true, trim: true, maxlength: 100 |
| description | String | required: true, maxlength: 2000. Detailed course description. |
| shortDescription | String | required: true, maxlength: 200. Brief summary for listings. |
| language | String | required: true, lowercase: true, Enum: ["python", "cpp", "javascript", "sql", "rust", "haskell"] |
| category | String | required: true, lowercase: true, Enum: ["programming-language", "data-structures", "algorithms", "web-development", "other"] |
| difficulty | String | default: "beginner", Enum: ["beginner", "intermediate", "advanced"] |
| instructor | ObjectId | Ref: 'User', required: true. Course creator. |
| sections | [ObjectId] | Ref: 'CourseSection'. Array of course sections. |
| finalQuiz | ObjectId | Ref: 'Quiz', default: null. Final assessment for the course. |
| certificateTemplate | String | default: "standard", Enum: ["standard", "distinguished", "excellence"] |
| thumbnail | String | default: null. URL to course thumbnail image. |
| estimatedHours | Number | default: 0. Estimated completion time in hours. |
| totalLessons | Number | default: 0. Total number of lessons in the course. |
| totalSections | Number | default: 0. Total number of sections. |
| enrollmentCount | Number | default: 0. Number of enrolled users. |
| viewCount | Number | default: 0. Number of times course was viewed. |
| completedCount | Number | default: 0. Number of users who completed. |
| averageRating | Number | default: 0, min: 0, max: 5. Average rating from users. |
| ratingCount | Number | default: 0. Number of ratings received. |
| isPremium | Boolean | default: false. Whether course requires premium subscription. |
| isPublished | Boolean | default: false. Whether course is visible to users. |
| isArchived | Boolean | default: false. Whether course is archived. |
| tags | [String] | Array of searchable tags. |
| prerequisites | [ObjectId] | Ref: 'Course'. Required courses before enrollment. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.8 CourseEnrollment

**Description:** Tracks a user's enrollment and progress in a specific course, including section and lesson completion.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| course | ObjectId | Ref: 'Course', required: true |
| enrollmentDate | Date | default: Date.now |
| status | String | default: "active", Enum: ["active", "completed", "dropped", "on-hold"] |
| completionDate | Date | Date when course was completed. |
| certificateIssued | Boolean | default: false |
| certificate | ObjectId | Ref: 'Certificate', default: null |
| sectionProgress | [Object] | Array of section progress objects. |
| sectionProgress.section | ObjectId | Ref: 'CourseSection', required: true |
| sectionProgress.isCompleted | Boolean | default: false |
| sectionProgress.completedAt | Date | When section was completed. |
| sectionProgress.lessons | [Object] | Array of lesson progress within section. |
| sectionProgress.lessons.lesson | ObjectId | Ref: 'CourseLesson', required: true |
| sectionProgress.lessons.isCompleted | Boolean | default: false |
| sectionProgress.lessons.completedAt | Date | When lesson was completed. |
| sectionProgress.lessons.timeSpentMinutes | Number | default: 0 |
| sectionProgress.lessons.lastAccessedAt | Date | Last time lesson was accessed. |
| sectionProgress.sectionQuizScore | Object | Quiz results for the section. |
| sectionProgress.sectionQuizScore.quizId | ObjectId | ID of the quiz. |
| sectionProgress.sectionQuizScore.score | Number | Score achieved (percentage). |
| sectionProgress.sectionQuizScore.maxScore | Number | Maximum possible score. |
| sectionProgress.sectionQuizScore.attemptCount | Number | default: 0 |
| sectionProgress.sectionQuizScore.lastAttemptAt | Date | Date of last quiz attempt. |
| sectionProgress.sectionQuizScore.passed | Boolean | Whether user passed the quiz. |
| sectionProgress.timeSpentMinutes | Number | default: 0. Total time in section. |
| overallProgress | Number | default: 0, min: 0, max: 100. Overall course completion percentage. |
| finalQuizScore | Object | Final assessment results. |
| finalQuizScore.quizId | ObjectId | ID of final quiz. |
| finalQuizScore.score | Number | Score achieved (percentage). |
| finalQuizScore.maxScore | Number | Maximum possible score. |
| finalQuizScore.attemptCount | Number | default: 0 |
| finalQuizScore.lastAttemptAt | Date | Date of last attempt. |
| finalQuizScore.passed | Boolean | Whether user passed. |
| totalTimeSpentMinutes | Number | default: 0. Total time spent in entire course. |
| lastAccessedAt | Date | Last time course was accessed. |
| notes | String | User's personal notes about the course. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.9 CourseLesson

**Description:** Represents a single lesson within a course section, containing learning content and code examples.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| section | ObjectId | Ref: 'CourseSection', required: true |
| title | String | required: true, trim: true. Lesson title. |
| description | String | default: "". Lesson description. |
| content | String | required: true. Main lesson content/text. |
| order | Number | required: true. Order within the section. |
| videoUrl | String | default: null. Optional video URL. |
| duration | Number | default: 0. Lesson duration in minutes. |
| codeExamples | [Object] | Array of code examples. |
| codeExamples.title | String | Title of the code example. |
| codeExamples.description | String | Description of the example. |
| codeExamples.code | String | The sample code. |
| codeExamples.language | String | Programming language. |
| codeExamples.input | String | Sample input. |
| codeExamples.expectedOutput | String | Expected output. |
| codeExamples.order | Number | Display order. |
| practiceProblems | [ObjectId] | Ref: 'CodeSnippet'. Practice coding problems. |
| notes | [String] | Array of additional notes. |
| tips | [String] | Array of helpful tips. |
| resources | [Object] | Additional learning resources. |
| resources.title | String | Resource title. |
| resources.url | String | Resource URL. |
| resources.type | String | Type like "documentation", "article", "video". |
| difficulty | String | default: "beginner", Enum: ["beginner", "intermediate", "advanced"] |
| estimatedHours | Number | default: 0. Estimated time to complete. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.10 CourseSection

**Description:** Represents a section (module) within a course, containing multiple lessons and an optional quiz.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| course | ObjectId | Ref: 'Course', required: true |
| title | String | required: true, trim: true. Section title. |
| description | String | default: "". Section description. |
| order | Number | required: true. Order within the course. |
| lessons | [ObjectId] | Ref: 'CourseLesson'. Array of lessons in this section. |
| sectionQuiz | ObjectId | Ref: 'Quiz', default: null. Optional quiz for this section. |
| estimatedHours | Number | default: 0. Estimated time to complete section. |
| isLocked | Boolean | default: false. Whether section is locked. |
| unlockCondition | String | default: null. Condition to unlock (e.g., "previous_section_completed"). |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.11 Feedback

**Description:** Represents user feedback (rating and comment) for a tutorial.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| tutorial | ObjectId | Ref: 'Tutorial', required: true |
| rating | Number | required: true, min: 1, max: 5 |
| comment | String | trim: true. Optional feedback comment. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.12 NewsletterSubscription

**Description:** Stores email addresses subscribed to the platform newsletter.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| email | String | required: true, unique: true, lowercase: true, trim: true, Validator: email format |
| subscribedAt | Date | default: Date.now. When user subscribed. |
| isActive | Boolean | default: true. Whether subscription is active. |
| ipAddress | String | default: null. IP address at subscription time. |
| userAgent | String | default: null. Browser/device info. |
| unsubscribedAt | Date | default: null. When user unsubscribed. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.13 Notification

**Description:** Represents in-app notifications sent to users.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| type | String | default: 'general'. Type of notification. |
| message | String | required: true. Notification message content. |
| link | String | default: null. Optional link/URL related to notification. |
| isRead | Boolean | default: false. Whether user has read the notification. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.14 Progress

**Description:** Tracks a user's progress on a specific tutorial.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| tutorial | ObjectId | Ref: 'Tutorial', required: true |
| completionPercent | Number | default: 0, min: 0, max: 100 |
| lastAccessed | Date | default: Date.now |
| timeSpentMinutes | Number | default: 0 |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.15 Quiz

**Description:** Represents an assessment quiz for courses, containing questions of various types.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| title | String | required: true, trim: true. Quiz title. |
| description | String | Quiz description. |
| type | String | default: "section-quiz", Enum: ["section-quiz", "final-quiz", "practice-quiz"] |
| course | ObjectId | Ref: 'Course'. Associated course. |
| section | ObjectId | Ref: 'CourseSection'. Associated section if section quiz. |
| questions | [Object] | Array of question objects. |
| questions.type | String | required: true, Enum: ["multiple-choice", "true-false", "short-answer", "coding"] |
| questions.question | String | required: true. The question text. |
| questions.description | String | Additional question description. |
| questions.order | Number | Display order of question. |
| questions.options | [Object] | For multiple-choice/true-false questions. |
| questions.options.text | String | Option text. |
| questions.options.isCorrect | Boolean | Whether this option is correct. |
| questions.acceptableAnswers | [String] | Array of acceptable answers for short-answer. |
| questions.caseSensitive | Boolean | default: false. For short-answer questions. |
| questions.codingProblem | Object | For coding questions. |
| questions.codingProblem.title | String | Problem title. |
| questions.codingProblem.description | String | Problem description. |
| questions.codingProblem.starterCode | String | Initial code template. |
| questions.codingProblem.language | String | Programming language. |
| questions.codingProblem.testCases | [Object] | Array of test cases. |
| questions.codingProblem.testCases.input | String | Test input. |
| questions.codingProblem.testCases.expectedOutput | String | Expected output. |
| questions.points | Number | default: 1, min: 1. Points for this question. |
| questions.explanation | String | Explanation of correct answer. |
| totalPoints | Number | default: 0. Auto-calculated total points. |
| passingScore | Number | default: 70, min: 0, max: 100. Passing percentage. |
| timeLimit | Number | default: 0. Time limit in minutes (0 = no limit). |
| shuffleQuestions | Boolean | default: true. Randomize question order. |
| shuffleOptions | Boolean | default: true. Randomize option order. |
| showAnswerExplanation | Boolean | default: true. Show explanations after completion. |
| retakeAllowed | Boolean | default: true. Allow retaking the quiz. |
| maxRetakes | Number | default: 3. Maximum number of retakes. |
| isPublished | Boolean | default: false. Whether quiz is active. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.16 SubscriptionCancellation

**Description:** Records when users cancel their premium subscriptions.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| user | ObjectId | Ref: 'User', required: true |
| stripeSubscriptionId | String | Stripe subscription identifier. |
| reason | String | default: null. User's reason for cancellation. |
| cancelledAt | Date | default: Date.now |
| ipAddress | String | default: null. IP address at cancellation. |
| userAgent | String | default: null. Browser/device info. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.17 Tutorial

**Description:** Represents a single educational lesson/tutorial on programming concepts.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| title | String | required: true, trim: true. Tutorial title. |
| description | String | required: true. Tutorial description. |
| content | String | required: true. Main tutorial content/body. |
| language | String | default: "python", lowercase: true, Enum: ["python", "cpp", "javascript"] |
| concept | String | required: true, trim: true. Concept being taught (e.g., "Loops"). |
| difficulty | String | default: "beginner", Enum: ["beginner", "intermediate", "advanced"] |
| codeExamples | [Object] | Array of code example sub-documents. |
| codeExamples.title | String | Example title. |
| codeExamples.description | String | Example description. |
| codeExamples.code | String | The sample code. |
| codeExamples.input | String | Sample input for the code. |
| codeExamples.expectedOutput | String | Expected output. |
| codeExamples.order | Number | Display order. |
| notes | [String] | Array of additional notes. |
| tips | [String] | Array of helpful tips. |
| createdBy | ObjectId | Ref: 'User', default: null. Creator (for admin-created content). |
| isPreGenerated | Boolean | default: true. Pre-created vs user-generated. |
| isAIgenerated | Boolean | default: false. Whether generated by AI. |
| isPremium | Boolean | default: false. Requires premium subscription. |
| isPublished | Boolean | default: false. Whether visible to users. |
| tags | [String] | Array of searchable tags. |
| averageRating | Number | default: 0. Calculated average rating. |
| viewCount | Number | default: 0. Number of views. |
| feedbacks | [ObjectId] | Ref: 'Feedback'. Array of feedback submissions. |
| pdfLink | String | default: null. Optional PDF version link. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.18 User

**Description:** Represents an authenticated user (student or admin), storing credentials, profile information, preferences, and subscription details.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| name | String | required: true, trim: true, minlength: 2, maxlength: 50 |
| email | String | required: true, unique: true, lowercase: true, Validator: email format |
| password | String | required if no OAuth, minlength: 6, select: false, Validator: strong password (8+ chars, uppercase, lowercase, number, special char) |
| googleId | String | default: null, sparse: true. For Google OAuth. |
| githubId | String | default: null, sparse: true. For GitHub OAuth. |
| isEmailVerified | Boolean | default: false |
| role | String | default: "user", Enum: ["user", "admin"] |
| lastLogin | Date | default: null |
| profilePicture | String | default: null. URL to profile image. |
| dateOfBirth | Date | default: null |
| bio | String | default: null, maxlength: 500 |
| location | String | default: null, maxlength: 100 |
| github | String | default: null. GitHub profile URL. |
| linkedin | String | default: null. LinkedIn profile URL. |
| website | String | default: null. Personal website URL. |
| programmingLanguages | [String] | Array of programming languages known. |
| skills | [String] | Array of skills. |
| interests | [String] | Array of interests. |
| experience | String | default: null, Enum: ["beginner", "intermediate", "advanced", "expert", null] |
| isProfileComplete | Boolean | default: false |
| profileCompletionPromptShown | Boolean | default: false |
| emailVerificationOTP | String | default: null |
| emailVerificationOTPExpires | Date | default: null |
| passwordResetOTP | String | default: null |
| passwordResetOTPExpires | Date | default: null |
| accountStatus | String | default: "pending", Enum: ["pending", "active", "suspended"] |
| failedLoginAttempts | Number | default: 0 |
| lastFailedLogin | Date | default: null |
| accountLockedUntil | Date | default: null |
| preferences | Object | User preferences object. |
| preferences.emailNotifications | Boolean | default: true |
| enrolledTutorials | [ObjectId] | Ref: 'Tutorial'. Array of enrolled tutorials. |
| enrolledCourses | [ObjectId] | Ref: 'CourseEnrollment'. Array of course enrollments. |
| savedCodes | [ObjectId] | Ref: 'CodeSnippet'. Array of saved code snippets. |
| progress | [ObjectId] | Ref: 'Progress'. Array of tutorial progress records. |
| certificates | [ObjectId] | Ref: 'Certificate'. Array of earned certificates. |
| recentAIChats | [Object] | Array of recent AI chat messages. |
| recentAIChats.message | String | User's message. |
| recentAIChats.response | String | AI's response. |
| recentAIChats.timestamp | Date | default: Date.now |
| subscriptionPlan | String | default: "free", Enum: ["free", "premium"] |
| subscriptionStatus | String | default: "none", Enum: ["none", "active", "past_due", "canceled"] |
| stripeCustomerId | String | default: null. Stripe customer ID. |
| stripeSubscriptionId | String | default: null. Stripe subscription ID. |
| subscriptionStart | Date | default: null. When subscription started. |
| subscriptionEnd | Date | default: null. When subscription ends. |
| chatQueriesRemaining | Number | default: 5. Remaining AI chat queries for free tier. |
| codeQueriesRemaining | Number | default: 5. Remaining code chat queries for free tier. |
| tutorialGenRemaining | Number | default: 5. Remaining AI tutorial generations for free tier. |
| createdAt | Date | Automatically managed by timestamps: true |
| updatedAt | Date | Automatically managed by timestamps: true |

---

### 4.3.1.19 UserSavedTutorial

**Description:** Represents the link when a user saves a tutorial, including detailed progress tracking.

| Attribute | Type | Description / Rules |
|-----------|------|---------------------|
| userId | ObjectId | Ref: 'User', required: true |
| tutorialId | ObjectId | Ref: 'Tutorial', required: true |
| progress | Object | Embedded progress tracking object. |
| progress.isCompleted | Boolean | default: false |
| progress.completedAt | Date | When tutorial was completed. |
| progress.completedCodeExamples | [Object] | Array of completed code examples. |
| progress.completedCodeExamples.exampleId | ObjectId | ID of completed code example. |
| progress.completedCodeExamples.completedAt | Date | When example was completed. |
| progress.lastAccessedAt | Date | Last time tutorial was accessed. |
| progress.rating | Number | default: null, min: 1, max: 5. User's rating. |
| progress.notes | String | User's personal notes on this tutorial. |
| savedAt | Date | default: Date.now |
| updatedAt | Date | default: Date.now |
| createdAt | Date | Automatically managed by timestamps: true |

---

## Summary

This data dictionary contains **19 database schemas** that comprise the complete CodeHub platform data model:

1. **AIChat** - AI chatbot conversations
2. **Analytics** - System analytics snapshots
3. **Certificate** - Course completion certificates
4. **CodeChat** - Code assistant AI conversations
5. **CodeSnippet** - User-saved code snippets
6. **Contact** - Contact form submissions
7. **Course** - Structured learning courses
8. **CourseEnrollment** - User course enrollments and progress
9. **CourseLesson** - Individual lessons within courses
10. **CourseSection** - Course sections/modules
11. **Feedback** - Tutorial feedback and ratings
12. **NewsletterSubscription** - Newsletter subscribers
13. **Notification** - User notifications
14. **Progress** - Tutorial progress tracking
15. **Quiz** - Course assessments and quizzes
16. **SubscriptionCancellation** - Subscription cancellation records
17. **Tutorial** - Educational tutorials
18. **User** - User accounts and profiles
19. **UserSavedTutorial** - Saved tutorial relationships

---

**Note:** All schemas utilize MongoDB with Mongoose ODM. Timestamps (`createdAt` and `updatedAt`) are automatically managed when `timestamps: true` is specified in the schema options.
