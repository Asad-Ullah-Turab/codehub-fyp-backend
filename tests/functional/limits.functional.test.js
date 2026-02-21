import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Subscription and query limit tests', () => {
  let freeUser;
  let userToken;

  beforeEach(async () => {
    // remove any existing test user
    await User.deleteMany({ email: /limituser.*@example\.com/ });
    freeUser = new User({
      name: 'Limit Test User',
      email: 'limituser@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      subscriptionPlan: 'free',
    });
    await freeUser.save();

    const loginResp = await request(app)
      .post('/api/auth/signin')
      .send({ email: freeUser.email, password: 'password123' });
    userToken = loginResp.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({ email: /limituser.*@example\.com/ });
  });

  it('should allow only 5 ai chat queries for free user', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/aichat/message')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: `hello ${i}` });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
    const blocked = await request(app)
      .post('/api/aichat/message')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'this should fail' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/limit reached/i);
  });

  it('should allow only 5 code chat queries for free user', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/codechat/message')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: `debug code ${i}` });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
    const blocked = await request(app)
      .post('/api/codechat/message')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'another question' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/limit reached/i);
  });

  it('should allow only 5 tutorial generations for free user', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/tutorials/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          language: 'python',
          concept: `topic${i}`,
          tags: ['AI-generated'],
        });
      // either 200 or 201 depending on implementation (createTutorial returns 201)
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    }
    const blocked = await request(app)
      .post('/api/tutorials/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        language: 'python',
        concept: 'one more',
        tags: ['AI-generated'],
      });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/limit reached/i);
  });

  it('admin user should bypass limits automatically', async () => {
    const admin = new User({
      name: 'Admin Limit User',
      email: 'limitadmin@example.com',
      password: 'adminpass',
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
    });
    await admin.save();
    const loginResp = await request(app)
      .post('/api/auth/signin')
      .send({ email: admin.email, password: 'adminpass' });
    const adminToken = loginResp.body.token;

    for (let i = 0; i < 7; i++) {
      const res = await request(app)
        .post('/api/aichat/message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'test admin' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });
});