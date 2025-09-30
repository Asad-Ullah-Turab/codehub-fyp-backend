import express from 'express';
import passport from '../config/passport.js';
import { signup, signin, logout, protect, oauthSuccess, oauthFailure } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);

// Debug route - list available auth methods
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Auth API endpoints',
    endpoints: {
      'POST /api/auth/signup': 'Register new user',
      'POST /api/auth/signin': 'Login with email/password', 
      'POST /api/auth/logout': 'Logout user',
      'GET /api/auth/google': `Google OAuth ${process.env.GOOGLE_CLIENT_ID ? 'Available' : 'Not configured'}`,
      'GET /api/auth/github': `GitHub OAuth ${process.env.GITHUB_CLIENT_ID ? 'Available' : 'Not configured'}`,
      'GET /api/auth/me': 'Get current user (requires auth)'
    }
  });
});

// Google OAuth routes - always register, handle missing config in middleware
console.log('Google OAuth Config:', {
  clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing'
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'Google OAuth is not configured'
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_not_configured`);
  }
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' })(req, res, next);
}, oauthSuccess);

// GitHub OAuth routes - always register, handle missing config in middleware  
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'GitHub OAuth is not configured'
    });
  }
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_not_configured`);
  }
  passport.authenticate('github', { failureRedirect: '/api/auth/failure' })(req, res, next);
}, oauthSuccess);

// OAuth failure route
router.get('/failure', oauthFailure);

// Test protected route
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

export default router;