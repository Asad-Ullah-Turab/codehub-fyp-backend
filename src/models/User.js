import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot be more than 50 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.githubId; // Password required only if not OAuth user
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    default: null,
    sparse: true // Allows multiple null values
  },
  githubId: {
    type: String,
    default: null,
    sparse: true // Allows multiple null values
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  // Email verification OTP
  emailVerificationOTP: {
    type: String,
    default: null
  },
  emailVerificationOTPExpires: {
    type: Date,
    default: null
  },
  // Password reset OTP
  passwordResetOTP: {
    type: String,
    default: null
  },
  passwordResetOTPExpires: {
    type: Date,
    default: null
  },
  // Account status
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending' // Account starts as pending until email is verified
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Instance method to set email verification OTP
userSchema.methods.setEmailVerificationOTP = function(otp) {
  this.emailVerificationOTP = otp;
  this.emailVerificationOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return this.save({ validateBeforeSave: false });
};

// Instance method to verify email OTP
userSchema.methods.verifyEmailOTP = function(otp) {
  if (!this.emailVerificationOTP || !this.emailVerificationOTPExpires) {
    return false;
  }
  
  if (Date.now() > this.emailVerificationOTPExpires) {
    return false; // OTP expired
  }
  
  return this.emailVerificationOTP === otp;
};

// Instance method to clear email verification OTP
userSchema.methods.clearEmailVerificationOTP = function() {
  this.emailVerificationOTP = null;
  this.emailVerificationOTPExpires = null;
  this.isEmailVerified = true;
  this.accountStatus = 'active';
  return this.save({ validateBeforeSave: false });
};

// Instance method to set password reset OTP
userSchema.methods.setPasswordResetOTP = function(otp) {
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return this.save({ validateBeforeSave: false });
};

// Instance method to verify password reset OTP
userSchema.methods.verifyPasswordResetOTP = function(otp) {
  if (!this.passwordResetOTP || !this.passwordResetOTPExpires) {
    return false;
  }
  
  if (Date.now() > this.passwordResetOTPExpires) {
    return false; // OTP expired
  }
  
  return this.passwordResetOTP === otp;
};

// Instance method to clear password reset OTP
userSchema.methods.clearPasswordResetOTP = function() {
  this.passwordResetOTP = null;
  this.passwordResetOTPExpires = null;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

export default User;