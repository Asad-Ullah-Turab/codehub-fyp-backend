// Integration tests for Course Routes
import request from 'supertest';
import app from '../../src/app.js';
import Course from '../../src/models/Course.js';
import User from '../../src/models/User.js';
import jwt from 'jsonwebtoken';

describe('Course Routes', () => {
  let testUser, testCourse, authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await testUser.save();

    // Create test course
    testCourse = new Course({
      title: 'Test Course',
      description: 'Test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: testUser._id,
      isPublished: true
    });
    await testCourse.save();

    // Get auth token by creating JWT manually
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing-only', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  });

  it('should get all courses', async () => {
    const response = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should get course by id', async () => {
    const response = await request(app)
      .get(`/api/courses/${testCourse._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Course');
  });

  it('should enroll user in course', async () => {
    const response = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        courseId: testCourse._id
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('enrolled');
  });

  it('should get user enrolled courses', async () => {
    // First enroll
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        courseId: testCourse._id
      });

    // Then get enrolled courses
    const response = await request(app)
      .get('/api/courses/user/enrolled')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should allow creator to publish/unpublish after initial admin approval and delete the course', async () => {
    // Create creator user and course
    const creator = new User({
      name: 'Creator User',
      email: 'creator@example.com',
      password: 'Password123!',
      role: 'creator',
      isEmailVerified: true,
      accountStatus: 'active',
    });
    await creator.save();

    const creatorToken = jwt.sign({ id: creator._id }, process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing-only', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const courseResponse = await request(app)
      .post('/api/creator/courses')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Creator Managed Course',
        description: 'A course managed by creator',
        shortDescription: 'Creator course',
        language: 'python',
        category: 'programming-language',
      })
      .expect(201);

    const creatorCourseId = courseResponse.body.data._id;

    // Request initial publish approval
    await request(app)
      .patch(`/api/creator/courses/${creatorCourseId}/publish-request`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);

    // Approve as admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
    });
    await admin.save();

    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing-only', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    await request(app)
      .patch(`/api/admin/creator-courses/${creatorCourseId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' })
      .expect(200);

    // Creator should be able to unpublish directly
    const unpublishResponse = await request(app)
      .patch(`/api/creator/courses/${creatorCourseId}/publish`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);

    expect(unpublishResponse.body.success).toBe(true);
    expect(unpublishResponse.body.data.isPublished).toBe(false);
    expect(unpublishResponse.body.data.status).toBe('draft');

    // Creator should be able to publish again directly
    const publishResponse = await request(app)
      .patch(`/api/creator/courses/${creatorCourseId}/publish`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);

    expect(publishResponse.body.success).toBe(true);
    expect(publishResponse.body.data.isPublished).toBe(true);
    expect(publishResponse.body.data.status).toBe('published');

    // Creator can delete their own course
    await request(app)
      .delete(`/api/creator/courses/${creatorCourseId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .expect(200);

    const deletedCourse = await Course.findById(creatorCourseId);
    expect(deletedCourse).toBeNull();
  });
});
