
// File: src/components/MovieList.js
import React from 'react';
import MovieCard from './MovieCard';

const MovieList = ({ title, movies, onMovieSelect, selectedMovieId }) => {
  if (!movies || movies.length === 0) {
    return (
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#512B49',
          marginBottom: '20px'
        }}>
          {title}
        </h2>
        <p style={{
          color: '#666',
          textAlign: 'center',
          padding: '40px 0',
          fontSize: '16px'
        }}>
          No movies found.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#512B49',
        marginBottom: '20px',
        borderLeft: '4px solid #BE2952',
        paddingLeft: '15px'
      }}>
        {title}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={onMovieSelect}
            isSelected={selectedMovieId === movie.id}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieList;