/**
 * Authentication Middleware
 * Verifies user is authenticated before accessing protected routes
 */

export const auth = (req, res, next) => {
  try {
    // Check if user is authenticated via session or JWT
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in first.'
      });
    }
    
    // User is authenticated, proceed to next middleware/route
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional Auth Middleware
 * Allows anonymous users but attaches user info if authenticated
 */
export const optionalAuth = (req, res, next) => {
  try {
    // If user exists, continue. If not, that's OK too.
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

export default auth;
