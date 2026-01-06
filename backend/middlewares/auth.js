const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key';

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token found. Please log in again.' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false, 
            message: 'Token has expired. Please log in again.' 
          });
        }
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid token. Please log in again.' 
        });
      }

      // Add user info to request
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email
      };
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error. Please try again.' 
    });
  }
};

// Validate registration input
const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Rate limiting middleware
const loginRateLimit = (req, res, next) => {
  // Implement rate limiting logic here
  next();
};

const registerRateLimit = (req, res, next) => {
  // Implement rate limiting logic here
  next();
};

const passwordResetRateLimit = (req, res, next) => {
  // Implement rate limiting logic here
  next();
};

// Require email verification middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  validateRegistration,
  validateLogin,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  requireEmailVerification
};