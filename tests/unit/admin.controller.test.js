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
  getRecentActivity
} from '../../src/controllers/adminController.js';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';
import AIChat from '../../src/models/AIChat.js';
import Progress from '../../src/models/Progress.js';
import Course from '../../src/models/Course.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';

// Mock email service
jest.mock('../../src/services/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

import emailService from '../../src/services/emailService.js';

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

  describe('getDashboardStats', () => {
    beforeEach(async () => {
      // Create test data
      await User.create([
        { name: 'User1', email: 'user1@test.com', password: 'pass', role: 'user', accountStatus: 'active' },
        { name: 'User2', email: 'user2@test.com', password: 'pass', role: 'admin', accountStatus: 'active' },
        { name: 'User3', email: 'user3@test.com', password: 'pass', role: 'user', accountStatus: 'suspended' }
      ]);
      await Tutorial.create([{ title: 'Tutorial1', language: 'python', difficulty: 'beginner', concept: 'variables', content: 'content', isPreGenerated: true }]);
      await AIChat.create([{ userId: 'user1', messages: [] }]);
      await Course.create([{ title: 'Course1', description: 'desc', language: 'python', difficulty: 'beginner' }]);
      await CourseEnrollment.create([{ userId: 'user1', courseId: 'course1' }]);
    });

    it('should get dashboard statistics', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getDashboardStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveProperty('totalUsers', 3);
      expect(res.responseData.data).toHaveProperty('totalAdmins', 1);
      expect(res.responseData.data).toHaveProperty('activeUsers', 2);
      expect(res.responseData.data).toHaveProperty('suspendedUsers', 1);
      expect(res.responseData.data).toHaveProperty('totalTutorials', 1);
      expect(res.responseData.data).toHaveProperty('totalChats', 1);
      expect(res.responseData.data).toHaveProperty('totalCourses', 1);
      expect(res.responseData.data).toHaveProperty('totalEnrollments', 1);
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      await User.create([
        { name: 'User1', email: 'user1@test.com', password: 'pass', role: 'user', accountStatus: 'active' },
        { name: 'User2', email: 'user2@test.com', password: 'pass', role: 'admin', accountStatus: 'active' }
      ]);
    });

    it('should get all users with pagination', async () => {
      const req = mockRequest({}, {}, { page: 1, limit: 10 });
      const res = mockResponse();

      await getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.users).toHaveLength(2);
      expect(res.responseData.data).toHaveProperty('totalPages');
      expect(res.responseData.data).toHaveProperty('currentPage', 1);
    });

    it('should filter users by status', async () => {
      const req = mockRequest({}, {}, { status: 'active' });
      const res = mockResponse();

      await getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.users).toHaveLength(2);
    });
  });

  describe('updateUserStatus', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should update user status', async () => {
      const req = mockRequest({ accountStatus: 'suspended', reason: 'Violation' }, { id: userId });
      const res = mockResponse();

      await updateUserStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('User status updated successfully');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.accountStatus).toBe('suspended');
    });

    it('should return 404 for non-existent user', async () => {
      const req = mockRequest({ accountStatus: 'suspended' }, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await updateUserStatus(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('User not found');
    });
  });

  describe('changeUserRole', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should change user role', async () => {
      const req = mockRequest({ role: 'admin' }, { id: userId });
      const res = mockResponse();

      await changeUserRole(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('User role updated successfully');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.role).toBe('admin');
    });
  });

  describe('deleteUser', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should delete user', async () => {
      const req = mockRequest({}, { id: userId });
      const res = mockResponse();

      await deleteUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('User deleted successfully');

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe('getUserDetails', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should get user details', async () => {
      const req = mockRequest({}, { id: userId });
      const res = mockResponse();

      await getUserDetails(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.name).toBe('Test User');
      expect(res.responseData.data.email).toBe('test@test.com');
    });
  });

  describe('updateUserDetails', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should update user details', async () => {
      const req = mockRequest({ name: 'Updated Name', email: 'updated@test.com' }, { id: userId });
      const res = mockResponse();

      await updateUserDetails(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('User details updated successfully');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('updated@test.com');
    });
  });

  describe('sendEmailToUser', () => {
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'pass',
        role: 'user',
        accountStatus: 'active'
      });
      userId = user._id.toString();
    });

    it('should send email to user', async () => {
      emailService.sendEmail.mockResolvedValue(true);

      const req = mockRequest({
        subject: 'Test Subject',
        message: 'Test Message'
      }, { id: userId });
      const res = mockResponse();

      await sendEmailToUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Email sent successfully');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'test@test.com',
        'Test Subject',
        'Test Message'
      );
    });

    it('should handle email service failure', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('Email service error'));

      const req = mockRequest({
        subject: 'Test Subject',
        message: 'Test Message'
      }, { id: userId });
      const res = mockResponse();

      await sendEmailToUser(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Failed to send email');
    });
  });

  describe('getAllTutorials', () => {
    beforeEach(async () => {
      await Tutorial.create([
        { title: 'Tutorial1', language: 'python', difficulty: 'beginner', concept: 'variables', content: 'content', isPreGenerated: true },
        { title: 'Tutorial2', language: 'javascript', difficulty: 'intermediate', concept: 'functions', content: 'content', isPreGenerated: false }
      ]);
    });

    it('should get all tutorials', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getAllTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(2);
    });
  });

  describe('updateTutorial', () => {
    let tutorialId;

    beforeEach(async () => {
      const tutorial = await Tutorial.create({
        title: 'Original Title',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'original content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();
    });

    it('should update tutorial', async () => {
      const req = mockRequest({
        title: 'Updated Title',
        content: 'updated content'
      }, { id: tutorialId });
      const res = mockResponse();

      await updateTutorial(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Tutorial updated successfully');

      const updatedTutorial = await Tutorial.findById(tutorialId);
      expect(updatedTutorial.title).toBe('Updated Title');
      expect(updatedTutorial.content).toBe('updated content');
    });
  });

  describe('deleteTutorial', () => {
    let tutorialId;

    beforeEach(async () => {
      const tutorial = await Tutorial.create({
        title: 'Tutorial to Delete',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();
    });

    it('should delete tutorial', async () => {
      const req = mockRequest({}, { id: tutorialId });
      const res = mockResponse();

      await deleteTutorial(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Tutorial deleted successfully');

      const deletedTutorial = await Tutorial.findById(tutorialId);
      expect(deletedTutorial).toBeNull();
    });
  });

  describe('createTutorial', () => {
    it('should create new tutorial', async () => {
      const req = mockRequest({
        title: 'New Tutorial',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'new content',
        isPreGenerated: true
      });
      const res = mockResponse();

      await createTutorial(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Tutorial created successfully');

      const createdTutorial = await Tutorial.findOne({ title: 'New Tutorial' });
      expect(createdTutorial).toBeTruthy();
      expect(createdTutorial.language).toBe('python');
    });
  });

  describe('getAnalytics', () => {
    beforeEach(async () => {
      // Create test data for analytics
      await User.create([
        { name: 'User1', email: 'user1@test.com', password: 'pass', role: 'user', accountStatus: 'active', createdAt: new Date() },
        { name: 'User2', email: 'user2@test.com', password: 'pass', role: 'user', accountStatus: 'active', createdAt: new Date() }
      ]);
      await Tutorial.create([
        { title: 'Tutorial1', language: 'python', difficulty: 'beginner', concept: 'variables', content: 'content', isPreGenerated: true },
        { title: 'Tutorial2', language: 'javascript', difficulty: 'intermediate', concept: 'functions', content: 'content', isPreGenerated: true }
      ]);
      await Progress.create([
        { userId: 'user1', tutorialId: 'tutorial1', completed: true },
        { userId: 'user2', tutorialId: 'tutorial2', completed: false }
      ]);
    });

    it('should get analytics data', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getAnalytics(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveProperty('userStats');
      expect(res.responseData.data).toHaveProperty('tutorialStats');
      expect(res.responseData.data).toHaveProperty('progressStats');
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await User.create([
        { name: 'John Doe', email: 'john@test.com', password: 'pass', role: 'user', accountStatus: 'active' },
        { name: 'Jane Smith', email: 'jane@test.com', password: 'pass', role: 'user', accountStatus: 'active' }
      ]);
    });

    it('should search users by name', async () => {
      const req = mockRequest({}, {}, { query: 'John' });
      const res = mockResponse();

      await searchUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(1);
      expect(res.responseData.data[0].name).toBe('John Doe');
    });

    it('should search users by email', async () => {
      const req = mockRequest({}, {}, { query: 'jane@test.com' });
      const res = mockResponse();

      await searchUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(1);
      expect(res.responseData.data[0].email).toBe('jane@test.com');
    });
  });

  describe('getRecentActivity', () => {
    beforeEach(async () => {
      await User.create([
        { name: 'User1', email: 'user1@test.com', password: 'pass', role: 'user', accountStatus: 'active', createdAt: new Date() },
        { name: 'User2', email: 'user2@test.com', password: 'pass', role: 'user', accountStatus: 'active', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      ]);
      await Tutorial.create([
        { title: 'Tutorial1', language: 'python', difficulty: 'beginner', concept: 'variables', content: 'content', isPreGenerated: true, createdAt: new Date() }
      ]);
    });

    it('should get recent activity', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getRecentActivity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveProperty('recentUsers');
      expect(res.responseData.data).toHaveProperty('recentTutorials');
    });
  });
});