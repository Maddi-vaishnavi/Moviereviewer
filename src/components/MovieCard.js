// src/components/MovieCard.js
import React from 'react';
import { Star, Calendar, Play } from 'lucide-react';

const MovieCard = ({ movie, onSelect }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450/512B49/white?text=No+Image';

  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? (movie.vote_average / 2).toFixed(1) : 0;

  return (
    <div 
      onClick={() => onSelect(movie)}
      style={{
        minWidth: '220px',
        maxWidth: '220px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        group: true
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 25px 50px rgba(255, 105, 180, 0.4)';
        e.currentTarget.style.border = '1px solid rgba(255, 105, 180, 0.6)';
        
        // Show play button overlay
        const overlay = e.currentTarget.querySelector('.play-overlay');
        if (overlay) {
          overlay.style.opacity = '1';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        // Hide play button overlay
        const overlay = e.currentTarget.querySelector('.play-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
        }
      }}
    >
      {/* Movie Poster */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img 
          src={posterUrl}
          alt={movie.title}
          style={{
            width: '100%',
            height: '320px',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onError={(e) => {
            e.target.src = 'https://dummyimage.com/300x450/512B49/ffffff&text=No+Image';
          }}

          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        />
        
        {/* Rating Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '20px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backdropFilter: 'blur(10px)'
        }}>
          <Star style={{ color: '#FFD700', fill: '#FFD700' }} size={14} />
          <span style={{
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {rating}
          </span>
        </div>

        {/* Play Button Overlay */}
        <div
          className="play-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            backdropFilter: 'blur(5px)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #FF69B4, #E91E63)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'scale(0.9)',
            transition: 'transform 0.3s ease',
            boxShadow: '0 8px 25px rgba(255, 105, 180, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(0.9)';
          }}
          >
            <Play size={24} fill="white" color="white" />
          </div>
        </div>

        {/* Gradient Overlay at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
          pointerEvents: 'none'
        }} />
      </div>
      
      {/* Movie Info */}
      <div style={{ padding: '18px' }}>
        <h3 style={{
          fontWeight: 'bold',
          fontSize: '16px',
          color: 'white',
          marginBottom: '10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          lineHeight: '1.2'
        }} title={movie.title}>
          {movie.title}
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Calendar style={{ color: '#E0E0E0' }} size={14} />
          <span style={{
            fontSize: '14px',
            color: '#E0E0E0',
            fontWeight: '500'
          }}>
            {releaseYear}
          </span>
        </div>
        
        {movie.overview && (
          <p style={{
            fontSize: '13px',
            color: '#B0B0B0',
            lineHeight: '1.5',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            margin: 0,
            height: '60px'
          }}>
            {movie.overview}
          </p>
        )}

        {/* Genres or additional info could go here */}
        {movie.genre_ids && movie.genre_ids.length > 0 && (
          <div style={{
            marginTop: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {movie.genre_ids.slice(0, 2).map((genreId) => (
              <span
                key={genreId}
                style={{
                  fontSize: '11px',
                  background: 'rgba(255, 105, 180, 0.2)',
                  color: '#FF69B4',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 105, 180, 0.3)',
                  fontWeight: '500'
                }}
              >
                #{genreId}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Subtle hover glow effect */}
      <div style={{
        position: 'absolute',
        inset: '-2px',
        background: 'linear-gradient(135deg, transparent, rgba(255, 105, 180, 0.1), transparent)',
        borderRadius: '18px',
        opacity: 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
        zIndex: -1
      }} />
    </div>
  );
};

export default MovieCard;