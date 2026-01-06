import React, { useState } from 'react';
import { X, Star, Calendar, Clock, Users, Award } from 'lucide-react';
import CommentSection from './CommentSection';

const StarRating = ({ rating, onRate, interactive = true, size = 20 }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fill: star <= (hover || rating) ? '#FFD700' : 'transparent',
            stroke: star <= (hover || rating) ? '#FFD700' : '#666',
            transition: 'all 0.2s ease'
          }}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
      {rating > 0 && (
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '14px', 
          color: 'white',
          fontWeight: 'bold'
        }}>
          {rating}/5
        </span>
      )}
    </div>
  );
};

const MovieModal = ({ movie, isOpen, onClose, userRating, onRate }) => {
  const [localRating, setLocalRating] = useState(userRating);

  if (!isOpen || !movie) return null;

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/400x600/512B49/white?text=No+Image';

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : '';

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const tmdbRating = movie.vote_average ? (movie.vote_average / 2).toFixed(1) : 0;

  const handleRate = (rating) => {
    setLocalRating(rating);
    onRate(movie.id, rating);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: backdropUrl 
          ? `linear-gradient(rgba(45, 90, 75, 0.95), rgba(81, 43, 73, 0.95), rgba(190, 41, 82, 0.95)), url(${backdropUrl})`
          : 'linear-gradient(135deg, #2D5A4B 0%, #512B49 30%, #BE2952 70%, #E91E63 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '24px',
        maxWidth: '900px',
        maxHeight: '90vh',
        width: '100%',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <X size={20} color="white" />
        </button>

        <div style={{ padding: '40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '40px',
            marginBottom: '40px'
          }}>
            {/* Movie Poster */}
            <div>
              <img 
                src={posterUrl} 
                alt={movie.title}
                style={{
                  width: '100%',
                  borderRadius: '16px',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x600/512B49/white?text=No+Image';
                }}
              />
            </div>

            {/* Movie Details */}
            <div style={{ color: 'white' }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '16px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                lineHeight: '1.2'
              }}>
                {movie.title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Calendar size={16} />
                  <span>{releaseYear}</span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Award size={16} />
                  <span>{tmdbRating}/5 TMDB</span>
                </div>

                {movie.vote_count && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Users size={16} />
                    <span>{movie.vote_count.toLocaleString()} votes</span>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white'
                }}>
                  <Star size={20} fill="#FFD700" stroke="#FFD700" />
                  Rate the Movie
                </h3>
                <StarRating
                  rating={localRating}
                  onRate={handleRate}
                  interactive={true}
                  size={24}
                />
                {localRating > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #BE2952, #E91E63)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    animation: 'fadeIn 0.3s ease-in-out',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    color: 'white'
                  }}>
                    ✨ You have rated this movie {localRating} stars!
                  </div>
                )}
              </div>

              {/* Overview */}
              {movie.overview && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '12px'
                  }}>
                    Overview
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    {movie.overview}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CommentSection
              movieId={movie.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;