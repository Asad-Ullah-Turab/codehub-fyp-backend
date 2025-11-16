import request from 'supertest';
import app from '../src/app.js';

async function testAdminRoleUpdate() {
  try {
    // First create admin user and get token
    const adminSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123'
      });

    const adminVerify = await request(app)
      .post('/api/auth/verify-email')
      .send({
        email: 'admin@example.com',
        otp: '123456'
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });

    const adminToken = adminLogin.body.data?.token;

    // Create regular user
    const userSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123'
      });

    const userVerify = await request(app)
      .post('/api/auth/verify-email')
      .send({
        email: 'regular@example.com',
        otp: '123456'
      });

    // Promote user to admin
    const promoteResponse = await request(app)
      .put('/api/admin/users/regular@example.com/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    console.log('Promote response:', JSON.stringify(promoteResponse.body, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminRoleUpdate();