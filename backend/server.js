const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieapp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  favoriteGenres: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true },
  content: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

// Rating Schema
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
const Rating = mongoose.model('Rating', ratingSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Validation Middleware
const validateInput = (requiredFields) => {
  return (req, res, next) => {
    const errors = requiredFields.filter(field => 
      !req.body[field] || req.body[field].toString().trim() === ''
    ).map(field => `${field} is required`);
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  };
};

// Auth Routes
app.post('/api/auth/register', validateInput(['username', 'email', 'password', 'firstName', 'lastName']), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, favoriteGenres } = req.body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Check existing user
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create user
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      favoriteGenres: favoriteGenres || []
    });

    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        favoriteGenres: user.favoriteGenres
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }
    
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', validateInput(['email', 'password']), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        favoriteGenres: user.favoriteGenres
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Rating Routes
app.get('/api/user/:userId/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find({ userId: req.params.userId })
      .populate('userId', 'username')
      .sort({ updatedAt: -1 });
    res.json({ success: true, ratings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.json({ success: false, ratings: [] });
  }
});

app.post('/api/user/:userId/ratings', authenticateToken, validateInput(['movieId', 'rating']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { movieId, rating } = req.body;

    // Validate user authorization
    if (req.user.id !== userId) {
      return res.json({ success: false });
    }

    // Validate rating value
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.json({ success: false });
    }

    // Validate movieId
    if (!movieId || typeof movieId !== 'string') {
      return res.json({ success: false });
    }

    // Find existing rating or create new one
    const existingRating = await Rating.findOne({ userId, movieId });
    let updatedRating;

    if (existingRating) {
      // Update existing rating
      existingRating.rating = ratingValue;
      existingRating.updatedAt = new Date();
      updatedRating = await existingRating.save();
    } else {
      // Create new rating
      updatedRating = await Rating.create({
        userId,
        movieId,
        rating: ratingValue,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Populate user details
    await updatedRating.populate('userId', 'username');

    res.json({ 
      success: true,
      rating: updatedRating 
    });
  } catch (error) {
    console.error('Error saving rating:', error);
    res.json({ success: false });
  }
});

app.get('/api/movie/:movieId/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find({ movieId: req.params.movieId })
      .populate('userId', 'username')
      .sort({ updatedAt: -1 });

    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    res.json({ 
      success: true,
      ratings,
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error fetching movie ratings:', error);
    res.json({ 
      success: false,
      ratings: [],
      averageRating: 0,
      totalRatings: 0
    });
  }
});

// In server.js, update the comment routes section to:

// Comment Routes - Update these routes to match the frontend expectations
app.get('/api/user/:userId/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await Comment.find({ userId: req.params.userId })
      .populate('userId', 'username firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
});

// Create comment - matches frontend expectation
app.post('/api/movie/:movieId/comments', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = new Comment({
      userId,
      movieId,
      content: content.trim()
    });

    await comment.save();
    await comment.populate('userId', 'username firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, message: 'Error creating comment' });
  }
});

// Update comment - matches frontend expectation
app.put('/api/user/:userId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { userId, commentId } = req.params;
    const { content } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this comment' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content: content.trim(), updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'username firstName lastName');

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: 'Error updating comment' });
  }
});

// Delete comment - matches frontend expectation
app.delete('/api/user/:userId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { userId, commentId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId, userId });

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
});

// Like comment - matches frontend expectation
app.put('/api/user/:userId/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    comment.likes = (comment.likes || 0) + 1;
    await comment.save();

    res.json({
      success: true,
      message: 'Comment liked successfully',
      likes: comment.likes
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ success: false, message: 'Error liking comment' });
  }
});

// Get movie comments with pagination - matches frontend expectation
app.get('/api/movie/:movieId/comments', async (req, res) => {
  try {
    const { movieId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ movieId })
      .populate('userId', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Comment.countDocuments({ movieId });

    res.json({ 
      success: true,
      comments,
      totalComments: total,
      hasMore: page * limit < total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching movie comments:', error);
    res.status(500).json({ success: false, message: 'Error fetching movie comments' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});