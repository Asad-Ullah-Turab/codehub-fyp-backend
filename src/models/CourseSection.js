import mongoose from "mongoose";

const courseSectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
    },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    isLocked: { type: Boolean, default: false },
    estimatedHours: { type: Number, default: 0 },
    sectionQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
  },
  { timestamps: true },
);

const CourseSection = mongoose.model("CourseSection", courseSectionSchema);
export default CourseSection;
