// src/components/MovieSection.js
import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieSection = ({ title, movies, onMovieSelect }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: '50px' }}>
      {title && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '25px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {title}
          </h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => scroll('left')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 105, 180, 0.3)';
                e.target.style.borderColor = '#FF69B4';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={20} color="white" />
            </button>
            
            <button
              onClick={() => scroll('right')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 105, 180, 0.3)';
                e.target.style.borderColor = '#FF69B4';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <ChevronRight size={20} color="white" />
            </button>
          </div>
        </div>
      )}
      
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '10px',
          scrollBehavior: 'smooth',
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 105, 180, 0.5) rgba(255, 255, 255, 0.1)'
        }}
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onSelect={onMovieSelect}
          />
        ))}
      </div>
    </section>
  );
};

export default MovieSection;