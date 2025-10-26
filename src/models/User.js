import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.githubId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    googleId: { type: String, default: null, sparse: true },
    githubId: { type: String, default: null, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastLogin: { type: Date, default: null },
    profilePicture: { type: String, default: null },

    // OTPs
    emailVerificationOTP: { type: String, default: null },
    emailVerificationOTPExpires: { type: Date, default: null },
    passwordResetOTP: { type: String, default: null },
    passwordResetOTPExpires: { type: Date, default: null },

    // Account status
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },

    // Preferences
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      notifications: { type: Boolean, default: true },
    },

    // Linked data
    enrolledTutorials: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tutorial" },
    ],
    savedCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "CodeSnippet" }],
    progress: [{ type: mongoose.Schema.Types.ObjectId, ref: "Progress" }],

    // Recent AI chat messages
    recentAIChats: [
      {
        message: String,
        response: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// 🔐 Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🧩 Methods
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return await bcrypt.compare(candidate, hashed);
};
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.setEmailVerificationOTP = function (otp) {
  this.emailVerificationOTP = otp;
  this.emailVerificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.verifyEmailOTP = function (otp) {
  if (
    !this.emailVerificationOTP ||
    Date.now() > this.emailVerificationOTPExpires
  )
    return false;
  return this.emailVerificationOTP === otp;
};
userSchema.methods.clearEmailVerificationOTP = function () {
  this.emailVerificationOTP = null;
  this.emailVerificationOTPExpires = null;
  this.isEmailVerified = true;
  this.accountStatus = "active";
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.setPasswordResetOTP = function (otp) {
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
  return this.save({ validateBeforeSave: false });
};
userSchema.methods.verifyPasswordResetOTP = function (otp) {
  if (!this.passwordResetOTP || Date.now() > this.passwordResetOTPExpires)
    return false;
  return this.passwordResetOTP === otp;
};
userSchema.methods.clearPasswordResetOTP = function () {
  this.passwordResetOTP = null;
  this.passwordResetOTPExpires = null;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);
export default User;
