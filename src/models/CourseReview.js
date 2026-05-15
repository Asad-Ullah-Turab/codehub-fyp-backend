import mongoose from "mongoose";

const courseReviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },
    isVerifiedEnrollment: {
      type: Boolean,
      default: false, // Set to true if user is enrolled in the course
    },
    helpful: {
      type: Number,
      default: 0, // Count of users who found this review helpful
    },
  },
  { timestamps: true },
);

// Compound unique index - one review per user per course
courseReviewSchema.index({ course: 1, user: 1 }, { unique: true });

// Index for quick lookups
courseReviewSchema.index({ course: 1 });
courseReviewSchema.index({ user: 1 });
courseReviewSchema.index({ rating: 1 });

const CourseReview = mongoose.model("CourseReview", courseReviewSchema);
export default CourseReview;
