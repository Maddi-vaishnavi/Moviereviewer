import React, { useState, useEffect, createContext, useContext } from 'react';
import MovieReviewer from './MovieReviewer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Initialize from localStorage or sessionStorage
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  // Update fetchUserProfile in auth.js
  const fetchUserProfile = async () => {
    try {
      const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!currentToken) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        throw new Error(errorData.message || 'Failed to fetch user');
      }
      
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update login function to handle errors better
  const login = async (userData, userToken) => {
    try {
      if (!userToken) {
        throw new Error('No token received from server');
      }

      // Store token first
      setToken(userToken);
      localStorage.setItem('token', userToken);
      sessionStorage.setItem('token', userToken);

      // Then set user data
      setUser(userData);
      setIsAuthenticated(true);

      // Finally fetch the complete user profile
      try {
        await fetchUserProfile();
      } catch (profileError) {
        console.error('Profile fetch error:', profileError);
        // Don't throw here, as we already have basic user data
      }
    } catch (error) {
      console.error('Login error:', error);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading, 
      isAuthenticated,
      setToken,
      setIsAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const Login = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Extract token and user data from the response
      const userToken = data.data?.token || data.token;
      const userData = data.data?.user || data.user;

      if (!userToken) {
        throw new Error('No authentication token received');
      }

      // Store token in both localStorage and sessionStorage
      localStorage.setItem('token', userToken);
      sessionStorage.setItem('token', userToken);

      // Call login function with user data and token
      await login(userData, userToken);
    } catch (error) {
      console.error('Login error:', error);
      setErrors([error.message || 'Login failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎬 Welcome Back</h1>
          <p>Sign in to continue your movie journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.length > 0 && (
            <div className="error-container">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <button onClick={onSwitchToForgotPassword} className="link-button">
            Forgot Password?
          </button>
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="link-button">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    favoriteGenres: []
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        login(data.user, data.token);
      } else {
        setErrors([data.message || 'Registration failed']);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors(['Registration failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre]
    }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎬 Join Movie Club</h1>
          <p>Create your account to start your movie journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.length > 0 && (
            <div className="error-container">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
            <small>Password must be at least 6 characters long</small>
          </div>

          <div className="form-group">
            <label>Favorite Genres (Optional)</label>
            <small>Select your favorite movie genres to get personalized recommendations</small>
            <div className="genre-grid">
              {genres.map(genre => (
                <button
                  key={genre}
                  type="button"
                  className={`genre-tag ${formData.favoriteGenres.includes(genre) ? 'selected' : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const ForgotPassword = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <h2>✉️ Check Your Email</h2>
            <p>{message}</p>
            <p>Click the link in the email to reset your password.</p>
            <button onClick={onSwitchToLogin} className="auth-button">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Reset Password</h1>
          <p>Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {message && !isSuccess && (
            <div className="error-container">
              <p className="error-message">{message}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Remember your password?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        {currentView === 'login' && (
          <Login
            onSwitchToRegister={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('forgot')}
          />
        )}
        {currentView === 'register' && (
          <Register onSwitchToLogin={() => setCurrentView('login')} />
        )}
        {currentView === 'forgot' && (
          <ForgotPassword onSwitchToLogin={() => setCurrentView('login')} />
        )}
      </div>
    );
  }

  return <MovieReviewer />;
};

const AuthApp = () => {
  return (
    <AuthProvider>
      <App />
      <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }

          .app {
            min-height: 100vh;
            background: linear-gradient(135deg, #2D5A4B 0%, #512B49 30%, #BE2952 70%, #E91E63 100%);
            position: relative;
          }

          .app::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.1;
            background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255, 105, 180, 0.1) 0%, transparent 50%);
            pointer-events: none;
          }

          .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            z-index: 1;
          }

          .auth-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            width: 100%;
            max-width: 500px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .auth-header {
            text-align: center;
            margin-bottom: 30px;
          }

          .auth-header h1 {
            color: white;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }

          .auth-header p {
            color: rgba(255, 255, 255, 0.8);
            font-size: 16px;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .form-row {
            display: flex;
            gap: 15px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .form-group label {
            color: white;
            font-weight: 500;
            margin-bottom: 8px;
            font-size: 14px;
          }

          .form-group input {
            padding: 12px 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 16px;
            transition: all 0.3s ease;
          }

          .form-group input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .form-group input:focus {
            outline: none;
            border-color: #FF69B4;
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.2);
          }

          .form-group small {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-top: 5px;
          }

          .genre-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }

          .genre-tag {
            padding: 6px 12px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .genre-tag:hover {
            border-color: #FF69B4;
            background: rgba(255, 105, 180, 0.2);
            color: white;
          }

          .genre-tag.selected {
            background: linear-gradient(135deg, #FF69B4, #E91E63);
            border-color: #E91E63;
            color: white;
          }

          .auth-button {
            background: linear-gradient(135deg, #FF69B4, #E91E63);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
          }

          .auth-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #E91E63, #BE2952);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(233, 30, 99, 0.3);
          }

          .auth-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .auth-links {
            text-align: center;
            margin-top: 25px;
          }

          .auth-links p {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 10px;
          }

          .link-button {
            background: none;
            border: none;
            color: #FF69B4;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            font-weight: 500;
            transition: color 0.3s ease;
          }

          .link-button:hover {
            color: #E91E63;
          }

          .error-container {
            background: rgba(255, 107, 107, 0.2);
            border: 1px solid rgba(255, 107, 107, 0.4);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 10px;
          }

          .error-message {
            color: #FF6B6B;
            font-size: 14px;
            margin: 0;
          }

          .success-message {
            text-align: center;
            color: white;
          }

          .success-message h2 {
            color: #4ECDC4;
            margin-bottom: 15px;
            font-size: 24px;
          }

          .success-message p {
            margin-bottom: 10px;
            font-size: 16px;
          }

          .loading-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #2D5A4B 0%, #512B49 30%, #BE2952 70%, #E91E63 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading-content {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            backdrop-filter: blur(10px);
            text-align: center;
            color: white;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 105, 180, 0.3);
            border-top: 4px solid #FF69B4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 640px) {
            .auth-card {
              padding: 30px 20px;
              margin: 10px;
            }

            .form-row {
              flex-direction: column;
              gap: 20px;
            }

            .auth-header h1 {
              font-size: 24px;
            }

            .genre-grid {
              justify-content: center;
            }
          }
      `}</style>
    </AuthProvider>
  );
};

export { useAuth };
export default AuthApp;