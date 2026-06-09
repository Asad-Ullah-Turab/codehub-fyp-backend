// Unit tests for Admin Controller
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  changeUserRole,
  deleteUser,
  getUserDetails,
  updateUserDetails,
  sendEmailToUser,
  notifyUserStatusChange,
  getAllTutorials,
  updateTutorial,
  deleteTutorial,
  createTutorial,
  getAnalytics,
  searchUsers,
  getRecentActivity,
  approveCertificate
} from '../../src/controllers/adminController.js';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';
import AIChat from '../../src/models/AIChat.js';
import Progress from '../../src/models/Progress.js';
import Course from '../../src/models/Course.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';
import Certificate from '../../src/models/Certificate.js';

// Mock email service
import { jest } from '@jest/globals';
// jest.mock('../../src/services/emailService.js', () => ({
//   sendEmail: jest.fn().mockResolvedValue(true)
// }));

// import emailService from '../../src/services/emailService.js';

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}, user = null) => ({
  body,
  params,
  query,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  return res;
};

describe('Admin Controller', () => {
  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await Tutorial.deleteMany({});
    await AIChat.deleteMany({});
    await Progress.deleteMany({});
    await Course.deleteMany({});
    await CourseEnrollment.deleteMany({});
    jest.clearAllMocks();
  });

  // verify dashboard stats includes premium user count
  it('should include premiumUsers in dashboard stats', async () => {
    // create one free user and one premium user
    await User.create({
      name: 'Free',
      email: 'free@example.com',
      password: 'Test@1234',
      subscriptionPlan: 'free',
      subscriptionStatus: 'none'
    });
    await User.create({
      name: 'Premium',
      email: 'premium@example.com',
      password: 'Test@1234',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active'
    });

    const req = mockRequest();
    const res = mockResponse();
    await getDashboardStats(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.responseData.data).toHaveProperty('premiumUsers');
    expect(typeof res.responseData.data.premiumUsers).toBe('number');
  });

});
