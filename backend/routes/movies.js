const express = require('express');
const router = express.Router();

// Import controller with error handling
let ratingController;
try {
  ratingController = require('../controllers/ratingController');
  
  if (!ratingController.getUserRatings || !ratingController.getTopRatedMovies) {
    throw new Error('Required functions not found in ratingController');
  }
} catch (error) {
  console.error('Error importing ratingController:', error.message);
  // Provide fallback functions
  ratingController = {
    getUserRatings: (req, res) => {
      res.status(500).json({
        success: false,
        message: 'getUserRatings controller not available'
      });
    },
    getTopRatedMovies: (req, res) => {
      res.status(500).json({
        success: false,
        message: 'getTopRatedMovies controller not available'
      });
    }
  };
}

// GET all ratings for a user
router.get('/user/:userId', (req, res, next) => {
  // Validate userId parameter
  const { userId } = req.params;
  
  if (!userId || userId.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  ratingController.getUserRatings(req, res, next);
});

// GET top rated movies
router.get('/top', ratingController.getTopRatedMovies);

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Ratings router is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;