import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, password, and confirm password'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: errors.join('. ')
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during signup'
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during signin'
    });
  }
};

export const protect = async (req, res, next) => {
  try {
    // Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth protection error:', error);
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again!'
    });
  }
};

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// OAuth success callback
export const oauthSuccess = (req, res) => {
  // User is authenticated via passport
  const user = req.user;
  
  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
  }

  // Update last login
  user.updateLastLogin();

  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-super-secret-jwt-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });

  // Set cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);

  // Redirect to frontend with success
  res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
};

// OAuth failure callback
export const oauthFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
};