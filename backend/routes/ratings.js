const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Rating = require('../models/Rating');
const mongoose = require('mongoose');

// Helper function for error responses
const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

// GET all ratings
router.get('/', (req, res) => {
  // Your handler logic here
  res.json({ message: 'Get all ratings' });
});

// GET rating by ID
router.get('/:id', (req, res) => {
  // Your handler logic here
  res.json({ message: `Get rating ${req.params.id}` });
});

// POST new rating
router.post('/', (req, res) => {
  // Your handler logic here
  res.json({ message: 'Create new rating' });
});

// PUT update rating
router.put('/:id', (req, res) => {
  // Your handler logic here
  res.json({ message: `Update rating ${req.params.id}` });
});

// DELETE rating
router.delete('/:id', (req, res) => {
  // Your handler logic here
  res.json({ message: `Delete rating ${req.params.id}` });
});

// GET ratings for a specific movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const ratings = await Rating.find({ movieId })
      .populate('userId', 'username firstName lastName')
      .sort({ updatedAt: -1 });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      success: true,
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Error fetching movie ratings:', error);
    errorResponse(res, 500, 'Error fetching movie ratings');
  }
});

// GET ratings by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(res, 400, 'Invalid user ID format');
    }

    const ratings = await Rating.find({ userId })
      .populate('userId', 'username firstName lastName')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      ratings
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    errorResponse(res, 500, 'Error fetching user ratings');
  }
});

// Get all ratings for a user
router.get('/ratings/user/:userId', async (req, res) => {
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

// Get ratings for a specific movie
router.get('/ratings/movie/:movieId', async (req, res) => {
  try {
    const ratings = await Rating.find({ movieId: req.params.movieId })
      .populate('userId', 'username')
      .sort({ updatedAt: -1 });
    
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
      : 0;

    res.json({
      success: true,
      ratings,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings
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

// Add or update a rating
router.post('/ratings', authenticateToken, async (req, res) => {
  try {
    const { movieId, rating } = req.body;
    const userId = req.user.id;

    // Validate rating value
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.json({ success: false });
    }

    // Use findOneAndUpdate with upsert to create or update the rating
    const updatedRating = await Rating.findOneAndUpdate(
      { userId, movieId },
      { rating: ratingValue, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({ success: true, rating: updatedRating });
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    res.json({ success: false });
  }
});

// Delete a rating
router.delete('/ratings/:movieId', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const result = await Rating.findOneAndDelete({ userId, movieId });
    if (!result) {
      return res.json({ success: false });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.json({ success: false });
  }
});

// Get a specific user's rating for a movie
router.get('/ratings/:movieId', authenticateToken, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findOne({ userId, movieId });
    res.json({ success: true, rating: rating || null });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.json({ success: false, rating: null });
  }
});

module.exports = router;