// Unit tests for Authentication Controller
import { signup, signin } from '../../src/controllers/authController.js';
import User from '../../src/models/User.js';

// Mock request and response objects
const mockRequest = (body = {}) => ({ body });
const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  res.cookie = function() { return this; };
  return res;
};

describe('Authentication Controller', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  describe('signup', () => {
    it('should create user with valid data', async () => {
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.data.user.name).toBe('Test User');
      expect(res.responseData.data.user.email).toBe('test@example.com');

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
    });

    it('should reject signup with missing fields', async () => {
      const req = mockRequest({
        name: 'Test User',
        // missing email, password, confirmPassword
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Please provide name, email, password, and confirm password');
    });

    it('should reject signup with mismatched passwords', async () => {
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword'
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Passwords do not match');
    });
  });

  describe('signin', () => {
    beforeEach(async () => {
      // Create a test user for signin tests
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active'
      });
      await user.save();
    });

    it('should signin user with correct credentials', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.token).toBeDefined();
      expect(res.responseData.data.user.name).toBe('Test User');
      expect(res.responseData.data.user.email).toBe('test@example.com');
    });

    it('should reject signin with wrong password', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Incorrect email or password');
    });

    it('should reject signin with non-existent email', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Incorrect email or password');
    });
  });
});
