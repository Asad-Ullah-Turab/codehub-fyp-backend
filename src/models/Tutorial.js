import mongoose from "mongoose";

const tutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    language: { type: String, default: "general" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin or system
    isAIgenerated: { type: Boolean, default: false },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    tags: [String],
    averageRating: { type: Number, default: 0 },
    feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
    pdfLink: { type: String, default: null },
  },
  { timestamps: true }
);

const Tutorial = mongoose.model("Tutorial", tutorialSchema);
export default Tutorial;
