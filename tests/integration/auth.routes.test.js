import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from '../../src/models/User.js';
import authRoutes from '../../src/routes/authRoutes.js';

// Mock email service
jest.mock('../../src/services/emailService.js', () => ({
  default: {
    initialize: jest.fn(),
    sendEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  }
}));

// Mock passport
jest.mock('../../src/config/passport.js', () => ({
  default: {
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => next(),
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    app = createTestApp();
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully! Please check your email to verify your account.');

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.isEmailVerified).toBe(false);
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Email already exists');
    });

    test('should validate password confirmation', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create verified user for login tests
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
    });

    test('should login verified user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Incorrect email or password');
    });

    test('should reject unverified user login', async () => {
      // Create unverified user
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Please verify your email before logging in');
    });
  });

  describe('GET /api/auth/verify-email/:token', () => {
    test('should verify email with valid token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Email verified successfully! You can now log in.');

      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.isEmailVerified).toBe(true);
    });

    test('should reject invalid verification token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/invalidtoken')
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Token is invalid or has expired');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    test('should resend verification email for unverified user', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Verification email sent! Please check your email.');
    });

    test('should handle already verified user', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Email is already verified');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
    });

    test('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password reset token sent to email!');
    });

    test('should handle non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('There is no user with that email address.');
    });
  });

  describe('PATCH /api/auth/reset-password/:token', () => {
    test('should reset password with valid token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isOldPassword = await updatedUser.correctPassword('password123', updatedUser.password);
      const isNewPassword = await updatedUser.correctPassword('newpassword123', updatedUser.password);
      
      expect(isOldPassword).toBe(false);
      expect(isNewPassword).toBe(true);
    });

    test('should reject password reset with invalid token', async () => {
      const response = await request(app)
        .patch('/api/auth/reset-password/invalidtoken')
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Token is invalid or has expired');
    });

    test('should validate password confirmation during reset', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const response = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          confirmPassword: 'differentpassword',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logged out successfully');
      
      // Check that JWT cookie is cleared
      const cookies = response.headers['set-cookie'];
      const jwtCookie = cookies?.find(cookie => cookie.includes('jwt='));
      expect(jwtCookie).toContain('jwt=;');
    });
  });

  describe('Authentication Flow End-to-End', () => {
    test('should complete full registration and login flow', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Step 1: Register
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body.status).toBe('success');

      // Step 2: Verify email
      const user = await User.findOne({ email: userData.email });
      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      // Step 3: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(userData.email);
    });

    test('should complete password reset flow', async () => {
      // Create verified user
      const user = await User.create({
        name: 'Password Reset User',
        email: 'reset@example.com',
        password: 'oldpassword123',
        isEmailVerified: true,
      });

      // Step 1: Request password reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      // Step 2: Reset password
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      const resetResponse = await request(app)
        .patch(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(resetResponse.body.status).toBe('success');

      // Step 3: Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });
  });
});