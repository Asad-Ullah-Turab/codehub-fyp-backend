import mongoose from "mongoose";

const courseLessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSection",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    order: { type: Number, required: true },
    videoUrl: { type: String, default: null },
    duration: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    estimatedHours: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CourseLesson = mongoose.model("CourseLesson", courseLessonSchema);
export default CourseLesson;
