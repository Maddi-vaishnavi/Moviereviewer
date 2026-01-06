import React, { useState } from 'react';
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';

const StarRating = ({ rating, onRate, interactive = false, size = 20, disabled = false }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px',
      alignItems: 'center',
      opacity: disabled ? 0.6 : 1
    }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          style={{
            cursor: interactive && !disabled ? 'pointer' : 'default',
            color: star <= (hover || rating) ? '#FFD700' : '#DDD',
            fill: star <= (hover || rating) ? '#FFD700' : 'transparent',
            transition: 'all 0.2s ease',
            transform: interactive && !disabled && hover === star ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={() => interactive && !disabled && onRate && onRate(star)}
          onMouseEnter={() => interactive && !disabled && setHover(star)}
          onMouseLeave={() => interactive && !disabled && setHover(0)}
        />
      ))}
      {rating > 0 && !disabled && (
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '14px', 
          color: 'white',
          fontWeight: 'bold'
        }}>
          {rating}/5
        </span>
      )}
      {disabled && (
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '12px', 
          color: 'rgba(255,255,255,0.7)'
        }}>
          Saving...
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number,
  onRate: PropTypes.func,
  interactive: PropTypes.bool,
  size: PropTypes.number,
  disabled: PropTypes.bool
};

export default StarRating;