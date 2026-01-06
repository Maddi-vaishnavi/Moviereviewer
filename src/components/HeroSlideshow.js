import React, { useState, useEffect } from 'react';
import { Play, Star, Calendar, TrendingUp } from 'lucide-react';

const HeroSlideshow = ({ movies, onMovieSelect }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (movies.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % movies.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentSlide];
  const backdropUrl = currentMovie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`
    : `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`;

  return (
    <div style={{
      position: 'relative',
      height: '500px',
      marginBottom: '40px',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    }}>
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'all 1s ease-in-out'
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
        }} />
      </div>
      
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '40px'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}>
            <TrendingUp style={{ color: '#FF69B4' }} size={20} />
            <span style={{
              color: '#FF69B4',
              fontWeight: 'bold',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Now Playing
            </span>
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.1',
            textShadow: '2px 2px 8px rgba(0,0,0,0.7)'
          }}>
            {currentMovie.title}
          </h1>
          <p style={{
            color: '#E0E0E0',
            fontSize: '16px',
            marginBottom: '25px',
            lineHeight: '1.6',
            maxHeight: '4.8em',
            overflow: 'hidden',
            textShadow: '1px 1px 4px rgba(0,0,0,0.7)'
          }}>
            {currentMovie.overview}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '25px',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star style={{ color: '#FFD700', fill: '#FFD700' }} size={20} />
              <span style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {(currentMovie.vote_average || 0).toFixed(1)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar style={{ color: '#E0E0E0' }} size={18} />
              <span style={{ color: '#E0E0E0', fontSize: '14px' }}>
                {new Date(currentMovie.release_date).getFullYear()}
              </span>
            </div>
          </div>
          <button
            onClick={() => onMovieSelect(currentMovie)}
            style={{
              background: 'linear-gradient(135deg, #FF69B4, #E91E63)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(255, 105, 180, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 105, 180, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 105, 180, 0.4)';
            }}
          >
            <Play size={20} fill="white" />
            View Details
          </button>
        </div>
      </div>

      {/* Slide indicators */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px'
      }}>
        {movies.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: index === currentSlide ? '30px' : '10px',
              height: '10px',
              borderRadius: '5px',
              border: 'none',
              background: index === currentSlide ? '#FF69B4' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlideshow;