const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const crypto = require('crypto');

class AuthController {
  // Generate JWT Token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id,
        email: user.email,
        username: user.username
      }, 
      process.env.JWT_SECRET || 'your-very-secure-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Register new user
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, favoriteGenres } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: existingUser.email === email.toLowerCase() 
            ? 'Email already registered' 
            : 'Username already taken'
        });
      }

      // Create new user
      const user = new User({
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        favoriteGenres: favoriteGenres || []
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      
      // Save user to database
      await user.save();

      // Send welcome email with verification link
      try {
        await emailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        verificationToken
      );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue with registration even if email fails
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove sensitive data
      user.password = undefined;
      user.emailVerificationToken = undefined;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user,
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Remove sensitive data
      user.password = undefined;
      user.emailVerificationToken = undefined;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      // Send response with token and user data
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            favoriteGenres: user.favoriteGenres || []
          },
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      // Find user with verification token
      const user = await User.findOne({ emailVerificationToken: token });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      // Send verification success email
      await emailService.sendEmailVerificationSuccess(user.email, user.firstName);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user found with this email address'
        });
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      const emailResult = await emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetToken
      );

      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset email'
        });
      }

      res.json({
        success: true,
        message: 'Password reset link sent to your email'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request'
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password and clear reset token
      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, favoriteGenres } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update fields
      if (firstName) user.firstName = firstName.trim();
      if (lastName) user.lastName = lastName.trim();
      if (favoriteGenres) user.favoriteGenres = favoriteGenres;

      await user.save();

      // Remove sensitive data
      user.password = undefined;
      user.emailVerificationToken = undefined;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Find user with password field
      const user = await User.findById(req.user.userId).select('+password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
}

module.exports = new AuthController();