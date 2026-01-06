import { useState, useEffect } from 'react';
import { movieService } from '../services/movieService';

export const useMovies = () => {
  const [movies, setMovies] = useState({
    nowPlaying: [],
    popular: [],
    topRated: [],
    upcoming: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const [nowPlaying, popular, topRated, upcoming] = await Promise.all([
          movieService.getNowPlaying(),
          movieService.getPopular(),
          movieService.getTopRated(),
          movieService.getUpcoming()
        ]);

        setMovies({
          nowPlaying: nowPlaying.results || [],
          popular: popular.results || [],
          topRated: topRated.results || [],
          upcoming: upcoming.results || []
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  return { movies, loading, error };
};