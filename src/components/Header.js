import React, { useState, useRef, useEffect } from 'react';
import { Film, User, LogIn, LogOut } from 'lucide-react';
import SearchBar from './SearchBar';

const Header = ({ onSearch, searchTerm, user, onLogin, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogin = () => {
    setShowDropdown(false);
    onLogin();
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  // Get user's first letter for avatar
  const getUserInitial = () => {
    if (user) {
      // Try different possible name fields
      const name = user.firstName || user.username || user.name;
      if (name) {
        return name.charAt(0).toUpperCase();
      }
    }
    return 'G'; // Default for guest
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, rgba(45, 90, 75, 0.95), rgba(81, 43, 73, 0.95))',
      backdropFilter: 'blur(10px)',
      padding: '20px 0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF69B4, #E91E63)',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(255, 105, 180, 0.3)'
          }}>
            <Film size={24} style={{ color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            MovieReviewer
          </h1>
        </div>
        
        <div style={{ flex: 1, maxWidth: '500px' }}>
          <SearchBar onSearch={onSearch} searchTerm={searchTerm} />
        </div>
        
        {/* User Avatar with Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            style={{
              background: user ? 'linear-gradient(135deg, #FF69B4, #E91E63)' : 'linear-gradient(135deg, #666, #888)',
              color: 'white',
              border: 'none',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              transition: 'all 0.3s ease',
              boxShadow: user ? '0 4px 15px rgba(255, 105, 180, 0.3)' : '0 4px 15px rgba(102, 102, 102, 0.3)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = user 
                ? '0 8px 25px rgba(255, 105, 180, 0.4)' 
                : '0 8px 25px rgba(102, 102, 102, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = user 
                ? '0 4px 15px rgba(255, 105, 180, 0.3)' 
                : '0 4px 15px rgba(102, 102, 102, 0.3)';
            }}
          >
            {user ? getUserInitial() : <User size={20} />}
            
            {/* Online indicator */}
            {user && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                background: '#4CAF50',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '55px',
              right: '0',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minWidth: '200px',
              overflow: 'hidden',
              animation: 'fadeInUp 0.2s ease-out'
            }}>
              {user ? (
                <>
                  {/* User Info */}
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(233, 30, 99, 0.1))'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #FF69B4, #E91E63)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {getUserInitial()}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#333',
                          fontSize: '14px'
                        }}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username || user.name || 'User'}
                        </div>
                        <div style={{
                          color: '#666',
                          fontSize: '12px'
                        }}>
                          {user.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: 'none',
                      background: 'transparent',
                      color: '#666',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 69, 58, 0.1)';
                      e.target.style.color = '#FF453A';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#666';
                    }}
                  >
                    <LogOut size={16} />
                    logout
                  </button>
                </>
              ) : (
                /* Login Button */
                <button
                  onClick={handleLogin}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: '#666',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 105, 180, 0.1)';
                    e.target.style.color = '#FF69B4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#666';
                  }}
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </header>
  );
};
export default Header;