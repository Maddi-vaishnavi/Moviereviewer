const Comment = require('../models/Comment');

const commentController = {
  // Get comments for a movie
  getMovieComments: async (req, res) => {
    try {
      const { movieId } = req;
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (page - 1) * limit;
      
      const comments = await Comment.find({ movieId })
        .populate('userId', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Comment.countDocuments({ movieId });
      
      res.json({
        success: true,
        data: comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: (page * limit) < total
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Create a new comment
  createComment: async (req, res) => {
    try {
      const { content, movieId } = req.body;
      const { id: userId } = req.user;
      
      const comment = new Comment({
        userId,
        movieId,
        content
      });
      
      await comment.save();
      await comment.populate('userId', 'username firstName lastName');
      
      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update a comment
  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const { id: userId } = req.user;
      
      const comment = await Comment.findOneAndUpdate(
        { _id: commentId, userId },
        { content },
        { new: true }
      ).populate('userId', 'username firstName lastName');
      
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or unauthorized'
        });
      }
      
      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Delete a comment
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { id: userId } = req.user;
      
      const comment = await Comment.findOneAndDelete({ 
        _id: commentId, 
        userId 
      });
      
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or unauthorized'
        });
      }
      
      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Like a comment
  likeComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likes: 1 } },
        { new: true }
      ).populate('userId', 'username firstName lastName');
      
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Comment liked successfully',
        data: {
          likes: comment.likes
        }
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to like comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = commentController;