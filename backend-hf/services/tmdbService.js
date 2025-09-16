import dotenv from 'dotenv';
dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.TMDB_API_KEY;

class TMDBService {
  // Helper method to make API calls with retry logic
  async makeRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 Making request to TMDB (attempt ${attempt}/${retries})`);
        
        const response = await fetch(url, {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'MovieRecommender/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.results || data;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async fetchPopularMovies(page = 1) {
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}&language=en-US`;
    return await this.makeRequest(url);
  }

  async fetchTopRatedMovies(page = 1) {
    const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}&language=en-US`;
    return await this.makeRequest(url);
  }

  async fetchMoviesByGenre(genreId, page = 1) {
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&language=en-US&sort_by=popularity.desc`;
    return await this.makeRequest(url);
  }

  async searchMovies(query, page = 1) {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`;
    return await this.makeRequest(url);
  }

  async getMovieDetails(movieId) {
    const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
    return await this.makeRequest(url);
  }

  async getGenres() {
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`;
    const data = await this.makeRequest(url);
    return data.genres || data;
  }

  // Convert TMDB movie to our format
  formatMovieForEmbedding(movie) {
    return {
      tmdb_id: movie.id,
      title: movie.title,
      description: movie.overview,
      poster_url: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      genre_ids: movie.genre_ids,
      popularity: movie.popularity
    };
  }

  // Get diverse movie collection
  async getDiverseMovieCollection() {
    try {
      console.log('🎬 Fetching diverse movie collection from TMDB...');
      console.log('🔑 Using API key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');
      
      // Test API connection first
      console.log('🧪 Testing TMDB API connection...');
      const testUrl = `${TMDB_BASE_URL}/configuration?api_key=${API_KEY}`;
      await this.makeRequest(testUrl);
      console.log('✅ TMDB API connection successful!');
      
      // Fetch movies with larger collections
      console.log('📦 Fetching movie collections...');
      
      const movieCollections = [];
      
      // Fetch popular movies from multiple pages
      try {
        console.log('🌟 Fetching popular movies (pages 1-3)...');
        for (let page = 1; page <= 3; page++) {
          const popularMovies = await this.fetchPopularMovies(page);
          movieCollections.push(...popularMovies.slice(0, 15));
          await this.delay(300);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch popular movies:', error.message);
      }
      
      // Fetch top rated movies from multiple pages
      try {
        console.log('🏆 Fetching top rated movies (pages 1-2)...');
        for (let page = 1; page <= 2; page++) {
          const topRated = await this.fetchTopRatedMovies(page);
          movieCollections.push(...topRated.slice(0, 15));
          await this.delay(300);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch top rated movies:', error.message);
      }
      
      // Fetch by genres with more variety
      const genres = [
        { id: 28, name: 'Action', limit: 12, pages: 2 },
        { id: 35, name: 'Comedy', limit: 12, pages: 2 },
        { id: 18, name: 'Drama', limit: 12, pages: 2 },
        { id: 878, name: 'Science Fiction', limit: 10, pages: 2 },
        { id: 27, name: 'Horror', limit: 8, pages: 1 },
        { id: 10749, name: 'Romance', limit: 8, pages: 1 },
        { id: 53, name: 'Thriller', limit: 10, pages: 2 },
        { id: 16, name: 'Animation', limit: 8, pages: 1 },
        { id: 80, name: 'Crime', limit: 8, pages: 1 },
        { id: 14, name: 'Fantasy', limit: 8, pages: 1 },
        { id: 12, name: 'Adventure', limit: 10, pages: 2 },
        { id: 10402, name: 'Music', limit: 5, pages: 1 },
        { id: 9648, name: 'Mystery', limit: 6, pages: 1 },
        { id: 10751, name: 'Family', limit: 6, pages: 1 },
        { id: 36, name: 'History', limit: 5, pages: 1 }
      ];
      
      for (const genre of genres) {
        try {
          console.log(`🎭 Fetching ${genre.name} movies...`);
          for (let page = 1; page <= genre.pages; page++) {
            const genreMovies = await this.fetchMoviesByGenre(genre.id, page);
            const moviesFromPage = genreMovies.slice(0, Math.ceil(genre.limit / genre.pages));
            movieCollections.push(...moviesFromPage);
            await this.delay(400);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch ${genre.name} movies:`, error.message);
        }
      }

      // Also fetch some trending movies (now playing)
      try {
        console.log('🔥 Fetching now playing movies...');
        const nowPlayingUrl = `${TMDB_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`;
        const nowPlaying = await this.makeRequest(nowPlayingUrl);
        movieCollections.push(...nowPlaying.slice(0, 10));
        await this.delay(300);
      } catch (error) {
        console.warn('⚠️ Failed to fetch now playing movies:', error.message);
      }

      // Fetch upcoming movies
      try {
        console.log('🚀 Fetching upcoming movies...');
        const upcomingUrl = `${TMDB_BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`;
        const upcoming = await this.makeRequest(upcomingUrl);
        movieCollections.push(...upcoming.slice(0, 8));
        await this.delay(300);
      } catch (error) {
        console.warn('⚠️ Failed to fetch upcoming movies:', error.message);
      }

      console.log(`📊 Total movies fetched before deduplication: ${movieCollections.length}`);

      // Remove duplicates based on movie ID
      const uniqueMovies = movieCollections.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      console.log(`🔄 After deduplication: ${uniqueMovies.length} movies`);

      // Filter out movies without overview or with short descriptions
      const moviesWithOverview = uniqueMovies.filter(movie => 
        movie.overview && 
        movie.overview.trim().length > 30 && 
        movie.title && 
        movie.title.trim().length > 0 &&
        movie.vote_count > 10 // Only movies with some votes
      );

      console.log(`✅ Final collection: ${moviesWithOverview.length} movies with good descriptions`);
      
      // Sort by popularity and vote average for quality
      moviesWithOverview.sort((a, b) => {
        const scoreA = (a.vote_average * 0.7) + (Math.log(a.popularity) * 0.3);
        const scoreB = (b.vote_average * 0.7) + (Math.log(b.popularity) * 0.3);
        return scoreB - scoreA;
      });

      return moviesWithOverview.map(movie => this.formatMovieForEmbedding(movie));

    } catch (error) {
      console.error('❌ Error fetching movies from TMDB:', error);
      throw error;
    }
  }
  
  // Helper method to add delays between requests
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new TMDBService();