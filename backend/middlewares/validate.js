const validationMiddleware = {
  // Validate movie ID parameter
  validateMovieId: (req, res, next) => {
    const { movieId } = req.params;
    
    if (!movieId || isNaN(parseInt(movieId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID is required'
      });
    }
    
    req.movieId = parseInt(movieId);
    next();
  },

  // Validate comment data
  validateComment: (req, res, next) => {
    const { user, comment } = req.body;
    
    if (!user || !comment) {
      return res.status(400).json({
        success: false,
        message: 'User name and comment are required'
      });
    }
    
    if (user.trim().length === 0 || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User name and comment cannot be empty'
      });
    }
    
    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }
    
    next();
  },

  // Validate rating data
  validateRating: (req, res, next) => {
    const { userId, rating } = req.body;
    
    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'User ID and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    next();
  }
};

module.exports = validationMiddleware;