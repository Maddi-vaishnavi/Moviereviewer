const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Helper function for error responses
const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

// Get comments for a movie with pagination
router.get('/movie/:movieId/comments', asyncHandler(async (req, res) => {
  try {
    const { movieId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate movieId
    if (!movieId || typeof movieId !== 'string') {
      return errorResponse(res, 400, 'Invalid movie ID');
    }

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
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    errorResponse(res, 500, 'Error fetching comments');
  }
}));

// Create a new comment
router.post('/movie/:movieId/comments', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { movieId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!content || typeof content !== 'string') {
      return errorResponse(res, 400, 'Comment content is required');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return errorResponse(res, 400, 'Comment cannot be empty');
    }

    if (trimmedContent.length > 1000) {
      return errorResponse(res, 400, 'Comment must be less than 1000 characters');
    }

    const comment = new Comment({
      userId,
      movieId,
      content: trimmedContent
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
    errorResponse(res, 500, 'Error creating comment');
  }
}));

// Update a comment
router.put('/user/:userId/comments/:commentId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId, commentId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || typeof content !== 'string') {
      return errorResponse(res, 400, 'Comment content is required');
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return errorResponse(res, 400, 'Comment cannot be empty');
    }

    if (trimmedContent.length > 1000) {
      return errorResponse(res, 400, 'Comment must be less than 1000 characters');
    }

    // Validate user ownership
    if (req.user.id !== userId) {
      return errorResponse(res, 403, 'Unauthorized to update this comment');
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content: trimmedContent, updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'username firstName lastName');
    
    if (!comment) {
      return errorResponse(res, 404, 'Comment not found or unauthorized');
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    errorResponse(res, 500, 'Error updating comment');
  }
}));

// Delete a comment
router.delete('/user/:userId/comments/:commentId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { userId, commentId } = req.params;

    // Validate user ownership
    if (req.user.id !== userId) {
      return errorResponse(res, 403, 'Unauthorized to delete this comment');
    }

    const comment = await Comment.findOneAndDelete({ _id: commentId, userId });
    
    if (!comment) {
      return errorResponse(res, 404, 'Comment not found or unauthorized');
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    errorResponse(res, 500, 'Error deleting comment');
  }
}));

// Like a comment
router.put('/user/:userId/comments/:commentId/like', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Validate comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(res, 404, 'Comment not found');
    }

    // Check if user already liked
    if (comment.likedBy && comment.likedBy.includes(userId)) {
      return errorResponse(res, 400, 'You already liked this comment');
    }

    // Update likes
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { 
        $inc: { likes: 1 },
        $addToSet: { likedBy: userId }
      },
      { new: true }
    ).populate('userId', 'username firstName lastName');

    res.json({
      success: true,
      message: 'Comment liked successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    errorResponse(res, 500, 'Error liking comment');
  }
}));

module.exports = router;