import rateLimit from 'express-rate-limit';

// General rate limiter for most routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict limiter for authentication routes (login, signup, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Limiter for password reset and email verification
export const verificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes 
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts, please wait 10 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for resource-intensive operations (code execution, AI)
export const resourceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many resource-intensive requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for contact form and public submissions
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 contact submissions per hour
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for AI services to prevent abuse
export const aiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10, // limit each IP to 10 AI requests per 2 minutes
  message: {
    success: false,
    message: 'Too many AI requests, please wait a moment before sending another.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  general: generalLimiter,
  auth: authLimiter,
  verification: verificationLimiter,
  resource: resourceLimiter,
  contact: contactLimiter,
  ai: aiLimiter,
};