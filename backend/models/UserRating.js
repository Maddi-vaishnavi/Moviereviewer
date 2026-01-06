const mongoose = require('mongoose');

const userRatingSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  movieTitle: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per movie
userRatingSchema.index({ movieId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('UserRating', userRatingSchema);