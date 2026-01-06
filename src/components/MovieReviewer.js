import React, { useState, useEffect } from 'react';
import { useMovies } from '../hooks/useMovies';
import { movieService } from '../services/movieService';
import Header from './Header';
import HeroSlideshow from './HeroSlideshow';
import MovieSection from './MovieSection';
import MovieModal from './MovieModal';
import { useAuth } from './auth';
import PropTypes from 'prop-types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MovieReviewer = () => {
  const { movies, loading, error } = useMovies();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const [movieComments, setMovieComments] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadUserData(user.id);
    }
  }, [user]);

  const loadUserData = async (userId) => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [ratingsResponse, commentsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/${userId}/ratings`, { headers }),
        fetch(`${API_BASE_URL}/api/user/${userId}/comments`, { headers })
      ]);
      
      if (!ratingsResponse.ok || !commentsResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const [ratingsData, commentsData] = await Promise.all([
        ratingsResponse.json(),
        commentsResponse.json()
      ]);
      
      // Convert ratings array to object for easier lookup
      const ratingsObject = {};
      if (ratingsData.ratings && Array.isArray(ratingsData.ratings)) {
        ratingsData.ratings.forEach(rating => {
          ratingsObject[rating.movieId] = rating.rating;
        });
      }
      
      setUserRatings(ratingsObject);
      setMovieComments(commentsData.comments || {});
    } catch (error) {
      console.error('Error loading user data:', error);
      setApiError('Failed to load user data');
    }
  };

  const handleSearch = async (query) => {
    setSearchTerm(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await movieService.searchMovies(query);
        setSearchResults(results.results || []);
        setApiError(null);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
        setApiError('Failed to search movies');
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleRate = async (movieId, rating) => {
    if (!user?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/${user.id}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ movieId, rating })
      });

      if (!response.ok) {
        throw new Error('Failed to save rating');
      }

      const data = await response.json();
      if (data.success) {
        // Update the ratings state
        setUserRatings(prev => ({
          ...prev,
          [movieId]: rating
        }));
        showSuccess('Rating saved successfully');
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      setApiError('Failed to save rating');
    }
  };

  const handleAddComment = async (movieId, commentText) => {
    if (!user?.id) return;
    
    const newComment = {
      id: Date.now(),
      text: commentText,
      user: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || user.email,
      timestamp: new Date().toISOString(),
      userId: user.id
    };
    
    setMovieComments(prev => ({
      ...prev,
      [movieId]: [...(prev[movieId] || []), newComment]
    }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id,
          movieId, 
          comment: newComment 
        })
      });

      if (!response.ok) throw new Error('Failed to save comment');
    } catch (error) {
      console.error('Error saving comment:', error);
      setApiError(error.message);
    }
  };

  const getUserInitial = () => {
    if (!user) return '';
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const hasUserRated = (movieId) => {
    return userRatings[movieId] !== undefined;
  };

  const getUserRating = (movieId) => {
    return userRatings[movieId] || 0;
  };

  const showSuccess = (message) => {
    // You can implement a toast notification here
    console.log(message);
  };

  if (loading) {
    return <div className="loading-spinner">Loading movies...</div>;
  }

  if (error) {
    return <div className="error-message">Error loading movies: {error}</div>;
  }

  return (
    <div className="movie-reviewer-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2D5A4B 30%, #512B49 70%, #BE2952 100%)',
      backgroundAttachment: 'fixed',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1925&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.1,
        zIndex: 0
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header 
          onSearch={handleSearch}
          searchTerm={searchTerm}
          user={user}
          onLogout={logout}
          userInitial={getUserInitial()}
        />
        
        {apiError && (
          <div style={{
            padding: '10px',
            background: 'rgba(255, 0, 0, 0.2)',
            color: 'white',
            textAlign: 'center'
          }}>
            {apiError}
          </div>
        )}
        
        <main>
          {searchTerm ? (
            <div className="search-results" style={{ padding: '20px' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>Search Results for "{searchTerm}"</h2>
              {isSearching ? (
                <div className="loading-spinner">Searching...</div>
              ) : (
                <MovieSection
                  movies={searchResults}
                  onMovieSelect={handleMovieSelect}
                />
              )}
            </div>
          ) : (
            <>
              <HeroSlideshow 
                movies={movies.nowPlaying?.slice(0, 5) || []}
                onMovieSelect={handleMovieSelect}
              />
              <div style={{ padding: '20px' }}>
                <MovieSection
                  title="Trending"
                  movies={movies.nowPlaying || []}
                  onMovieSelect={handleMovieSelect}
                />
                <MovieSection
                  title="Popular"
                  movies={movies.popular || []}
                  onMovieSelect={handleMovieSelect}
                />
                <MovieSection
                  title="Top Rated"
                  movies={movies.topRated || []}
                  onMovieSelect={handleMovieSelect}
                />
                <MovieSection
                  title="Upcoming"
                  movies={movies.upcoming || []}
                  onMovieSelect={handleMovieSelect}
                />
              </div>
            </>
          )}
          {/* Footer */}
          <footer style={{
            marginTop: '60px',
            padding: '40px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              margin: 0
            }}>
              © 2025 MovieReviwer. Powered by The Movie Database (TMDB).
            </p>
          </footer>
        </main>
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userRating={getUserRating(selectedMovie.id)}
          comments={selectedMovie ? movieComments[selectedMovie.id] || [] : []}
          onRate={handleRate}
          onAddComment={handleAddComment}
          isAuthenticated={!!user}
          isRatingLoading={isRatingLoading}
        />
      )}
    </div>
  );
};

export default MovieReviewer;