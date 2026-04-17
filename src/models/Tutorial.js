import mongoose from "mongoose";

const codeExampleSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    language: { type: String, default: "" },
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
    order: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: true },
);

const resourceSchema = new mongoose.Schema(
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
  { _id: false },
);

const tutorialSchema = new mongoose.Schema(
  {
    // Core tutorial information
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Main learning content
    content: {
      type: String,
      required: true,
    },

    // Programming language
    language: {
      type: String,
      enum: ["python", "cpp", "javascript"],
      default: "python",
      lowercase: true,
    },

    // Concept or topic name
    concept: {
      type: String,
      required: true,
      trim: true,
    },

    // Difficulty level
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    learningObjectives: [String],
    keyTakeaways: [String],
    recommendedDurationMinutes: {
      type: Number,
      default: 0,
    },

    // Code examples and supporting resources
    codeExamples: [codeExampleSchema],
    resources: [resourceSchema],

    // Additional notes and tips
    notes: [String],
    tips: [String],

    // Tracking and ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPreGenerated: {
      type: Boolean,
      default: true,
    },
    isAIgenerated: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },

    // Metadata
    tags: [String],
    averageRating: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    feedbacks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback",
      },
    ],
    pdfLink: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for efficient querying
tutorialSchema.index({ language: 1, concept: 1 });
tutorialSchema.index({ language: 1, difficulty: 1 });
tutorialSchema.index({ createdBy: 1 });
tutorialSchema.index({ isPreGenerated: 1 });

const Tutorial = mongoose.model("Tutorial", tutorialSchema);
export default Tutorial;
