const UserRating = require('../models/UserRating');

const ratingController = {
  // GET all ratings for a user
  getUserRatings: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const ratings = await UserRating.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const totalRatings = await UserRating.countDocuments({ userId });
      
      res.json({
        success: true,
        data: ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalRatings,
          hasNextPage: skip + ratings.length < totalRatings,
          hasPrevPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user ratings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // GET top rated movies
  getTopRatedMovies: async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      
      const topMovies = await UserRating.aggregate([
        {
          $group: {
            _id: '$movieId',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            movieTitle: { $first: '$movieTitle' }
          }
        },
        {
          $match: {
            totalRatings: { $gte: 5 } // Only movies with at least 5 ratings
          }
        },
        {
          $sort: { averageRating: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
      
      res.json({
        success: true,
        data: topMovies
      });
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top rated movies',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = ratingController;
