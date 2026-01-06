// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Movie API functions
export const movieAPI = {
  // Get all movies
  getAllMovies: () => apiRequest('/movies'),
  
  // Get movie by ID
  getMovieById: (id) => apiRequest(`/movies/${id}`),
  
  // Search movies
  searchMovies: (query) => apiRequest(`/movies/search?q=${encodeURIComponent(query)}`),
  
  // Create new movie
  createMovie: (movieData) => apiRequest('/movies', {
    method: 'POST',
    body: JSON.stringify(movieData),
  }),
  
  // Update movie
  updateMovie: (id, movieData) => apiRequest(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(movieData),
  }),
  
  // Delete movie
  deleteMovie: (id) => apiRequest(`/movies/${id}`, {
    method: 'DELETE',
  }),
};

// Comments API functions
export const commentAPI = {
  // Get comments for a movie
  getMovieComments: (movieId) => apiRequest(`/comments/movie/${movieId}`),
  
  // Add comment
  addComment: (commentData) => apiRequest('/comments', {
    method: 'POST',
    body: JSON.stringify(commentData),
  }),
  
  // Update comment
  updateComment: (id, commentData) => apiRequest(`/comments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(commentData),
  }),
  
  // Delete comment
  deleteComment: (id) => apiRequest(`/comments/${id}`, {
    method: 'DELETE',
  }),
};

// Ratings API functions
export const ratingAPI = {
  // Get ratings for a movie
  getMovieRatings: (movieId) => apiRequest(`/ratings/movie/${movieId}`),
  
  // Add/Update rating
  addRating: (ratingData) => apiRequest('/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
  
  // Get average rating for a movie
  getAverageRating: (movieId) => apiRequest(`/ratings/movie/${movieId}/average`),
};

// Health check
export const healthCheck = () => apiRequest('/health');

export default {
  movieAPI,
  commentAPI,
  ratingAPI,
  healthCheck,
};