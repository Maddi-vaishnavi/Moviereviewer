const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User');
const mongoose = require('mongoose');
const {
  authenticateToken,
  requireEmailVerification,
  validateRegistration,
  validateLogin,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit
} = require('../middleware/auth');

// Public routes
router.post('/register', registerRateLimit, validateRegistration, authController.register);
router.post('/login', loginRateLimit, validateLogin, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

// Routes that require email verification
router.get('/verified-profile', authenticateToken, requireEmailVerification, authController.getProfile);

// GET /me - Get current authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture || null,
        bio: user.bio || '',
        favoriteGenres: user.favoriteGenres || [],
        reviewCount: user.reviewCount || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /user/:userId/ratings - Get user's ratings
router.get('/user/:userId/ratings', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // TODO: Implement ratings schema and fetch actual ratings
    // For now, return empty array with user info
    res.json({
      success: true,
      ratings: [], // TODO: Replace with actual ratings from database
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: 'Ratings retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings'
    });
  }
});

// GET /user/:userId/comments - Get user's comments
router.get('/user/:userId/comments', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // TODO: Implement comments schema and fetch actual comments
    // For now, return empty array with user info
    res.json({
      success: true,
      comments: [], // TODO: Replace with actual comments from database
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: 'Comments retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

// GET /user/:userId/profile - Get public user profile
router.get('/user/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Fetch user (exclude sensitive information for public profile)
    const user = await User.findById(userId).select('-password -email -resetPasswordToken -resetPasswordExpires -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        favoriteGenres: user.favoriteGenres,
        reviewCount: user.reviewCount,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      message: 'User profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
});

module.exports = router;