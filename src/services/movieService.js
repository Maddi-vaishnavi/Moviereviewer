const API_KEY = '7c69402c2a3a16a5d71f3e890a1043d4';
const BASE_URL = 'https://api.themoviedb.org/3';

export const movieService = {
  getNowPlaying: async () => {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch now playing movies');
    return await response.json();
  },
  
  getPopular: async () => {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch popular movies');
    return await response.json();
  },
  
  getTopRated: async () => {
    const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch top rated movies');
    return await response.json();
  },
  
  getUpcoming: async () => {
    const response = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch upcoming movies');
    return await response.json();
  },
  
  getGenres: async () => {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch genres');
    return await response.json();
  },
  
  searchMovies: async (query) => {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search movies');
    return await response.json();
  },

  getMovieDetails: async (movieId) => {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch movie details');
    return await response.json();
  }
};