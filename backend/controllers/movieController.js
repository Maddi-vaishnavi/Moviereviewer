// controllers/movieController.js
const fs = require('fs').promises;
const path = require('path');

// Helper function to read movies data
const readMoviesData = async () => {
  try {
    const dataPath = path.join(__dirname, '../data/movies.json');
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading movies data:', error);
    return { movies: [], comments: [] };
  }
};

// Helper function to write movies data
const writeMoviesData = async (data) => {
  try {
    const dataPath = path.join(__dirname, '../data/movies.json');
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing movies data:', error);
    return false;
  }
};

// Helper function to generate unique ID
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// GET /api/movies - Get all movies with optional pagination and search
const getMovies = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', genre = '' } = req.query;
    const data = await readMoviesData();
    let movies = data.movies || [];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      movies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchLower) ||
        movie.description.toLowerCase().includes(searchLower) ||
        movie.director.toLowerCase().includes(searchLower) ||
        movie.actors.some(actor => actor.toLowerCase().includes(searchLower))
      );
    }

    // Apply genre filter
    if (genre) {
      movies = movies.filter(movie => 
        movie.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMovies = movies.slice(startIndex, endIndex);

    // Add comment counts to movies
    const moviesWithCommentCounts = paginatedMovies.map(movie => {
      const movieComments = (data.comments || []).filter(comment => comment.movieId === movie.id);
      return {
        ...movie,
        commentCount: movieComments.length
      };
    });

    res.json({
      success: true,
      data: moviesWithCommentCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(movies.length / parseInt(limit)),
        totalMovies: movies.length,
        hasNextPage: endIndex < movies.length,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting movies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/movies/search - Search movies
const searchMovies = async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query) {
      return res.json({
        success: true,
        data: [],
        message: 'No search query provided'
      });
    }

    const data = await readMoviesData();
    const movies = data.movies || [];
    const searchLower = query.toLowerCase();

    const searchResults = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchLower) ||
      movie.description.toLowerCase().includes(searchLower) ||
      movie.director.toLowerCase().includes(searchLower) ||
      movie.actors.some(actor => actor.toLowerCase().includes(searchLower))
    ).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: searchResults,
      query: query,
      resultCount: searchResults.length
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/movies/:id - Get movie by ID
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readMoviesData();
    const movies = data.movies || [];
    
    const movie = movies.find(m => m.id === id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Add comment count
    const movieComments = (data.comments || []).filter(comment => comment.movieId === id);
    const movieWithCommentCount = {
      ...movie,
      commentCount: movieComments.length
    };

    res.json({
      success: true,
      data: movieWithCommentCount
    });
  } catch (error) {
    console.error('Error getting movie by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/movies/:id/comments - Get comments for a movie
const getComments = async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
    
    const data = await readMoviesData();
    let comments = (data.comments || []).filter(comment => comment.movieId === movieId);

    // Sort comments
    if (sortBy === 'newest') {
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'likes') {
      comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = comments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedComments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(comments.length / parseInt(limit)),
        totalComments: comments.length,
        hasNextPage: endIndex < comments.length,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/movies/:id/comments - Add comment to a movie
const addComment = async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { user, comment } = req.body;

    // Validation
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be less than 1000 characters'
      });
    }

    // Verify movie exists
    const data = await readMoviesData();
    const movies = data.movies || [];
    const movie = movies.find(m => m.id === movieId);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Create new comment
    const newComment = {
      id: generateId(),
      movieId: movieId,
      user: user?.trim() || 'Anonymous',
      comment: comment.trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add comment to data
    if (!data.comments) {
      data.comments = [];
    }
    data.comments.unshift(newComment); // Add to beginning for newest first

    // Save data
    const saved = await writeMoviesData(data);
    if (!saved) {
      throw new Error('Failed to save comment');
    }

    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/comments/:id/like - Like a comment
const likeComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    
    const data = await readMoviesData();
    const comments = data.comments || [];
    
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Increment likes
    comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
    comments[commentIndex].updatedAt = new Date().toISOString();

    // Save data
    const saved = await writeMoviesData(data);
    if (!saved) {
      throw new Error('Failed to update comment likes');
    }

    res.json({
      success: true,
      data: {
        id: commentId,
        likes: comments[commentIndex].likes
      },
      message: 'Comment liked successfully'
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  addComment,
  getComments,
  likeComment,
  searchMovies
};