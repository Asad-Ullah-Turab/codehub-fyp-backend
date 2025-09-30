import express from 'express';
import passport, { isStrategyAvailable } from '../config/oauthConfig.js';
import { signup, signin, logout, protect, oauthSuccess, oauthFailure } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'Google OAuth is not configured'
    });
  }
  
  // Check if Google strategy is available
  if (!isStrategyAvailable('google')) {
    return res.status(500).json({
      status: 'error',
      message: 'Google OAuth strategy is not available. Please check server configuration.'
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
  
  if (!isStrategyAvailable('google')) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_strategy_unavailable`);
  }
  
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' })(req, res, next);
}, oauthSuccess);

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'GitHub OAuth is not configured'
    });
  }
  
  if (!isStrategyAvailable('github')) {
    return res.status(500).json({
      status: 'error',
      message: 'GitHub OAuth strategy is not available. Please check server configuration.'
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
  
  if (!isStrategyAvailable('github')) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_strategy_unavailable`);
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