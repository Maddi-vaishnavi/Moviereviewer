import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, searchTerm }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Search 
        size={20}
        style={{
          position: 'absolute',
          left: '15px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#512B49',
          zIndex: 1
        }}
      />
      <input
        type="text"
        placeholder="Search movies..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        style={{
          width: '100%',
          paddingLeft: '50px',
          paddingRight: '20px',
          paddingTop: '12px',
          paddingBottom: '12px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.3s ease',
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#FF69B4';
          e.target.style.boxShadow = '0 0 20px rgba(255, 105, 180, 0.3)';
          e.target.style.background = 'white';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.target.style.boxShadow = 'none';
          e.target.style.background = 'rgba(255, 255, 255, 0.9)';
        }}
      />
    </div>
  );
};

export default SearchBar;