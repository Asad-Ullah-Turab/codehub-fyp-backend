import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    codeExamples: [
      {
        title: String,
        description: String,
        code: String,
        language: String,
        input: String,
        expectedOutput: String,
        order: Number,
        notes: String,
        explanation: String,
      },
    ],
    notes: [String],
    tips: [String],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["documentation", "article", "video", "reference", "example"],
          default: "reference",
        },
        description: { type: String, default: "" },
        order: { type: Number, default: 0 },
      },
    ],
  },
  { _id: true },
);

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
    lessons: [lessonSchema],
    estimatedHours: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    unlockCondition: {
      type: String,
      default: null,
    },
    sectionQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
  },
  { _id: true },
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    language: {
      type: String,
      enum: ["python", "cpp", "javascript", "sql", "rust", "haskell"],
      required: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: [
        "programming-language",
        "data-structures",
        "algorithms",
        "web-development",
        "mobile-development",
        "data-science",
        "machine-learning",
        "devops",
        "security",
        "game-development",
        "blockchain",
        "cloud-computing",
        "databases",
        "system-design",
        "testing-qa",
        "other",
      ],
      required: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    learningObjectives: [String],
    outcomes: [String],
    requirements: [String],
    targetAudience: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "archived", "rejected"],
      default: "draft",
    },
    publishRequestedAt: {
      type: Date,
      default: null,
    },
    publishReviewComment: {
      type: String,
      default: null,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sections: [sectionSchema],
    finalQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    certificateTemplate: {
      type: String,
      default: "standard",
      enum: ["standard", "distinguished", "excellence"],
    },
    certificateSignerName: {
      type: String,
      default: "",
    },
    certificateSignerTitle: {
      type: String,
      default: "",
    },
    certificateSealLabel: {
      type: String,
      default: "Official Seal",
    },
    certificateFooterText: {
      type: String,
      default: "Verified Achievement • Authenticated Completion • Excellence Recognized",
    },
    thumbnail: {
      type: String,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalSections: {
      type: Number,
      default: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    hasAdminApprovedPublish: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true },
);

// Indexes for better query performance
courseSchema.index({ language: 1, category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1, isArchived: 1 });
courseSchema.index({ category: 1, difficulty: 1 });

const Course = mongoose.model("Course", courseSchema);
export default Course;
