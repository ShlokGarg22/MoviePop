import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import tmdbService from '../services/tmdbService.js';

dotenv.config();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Option to use TMDB data or mock data
const USE_TMDB = true;

// Mock movie data as fallback
const mockMovies = [
  {
    title: "The Matrix",
    description: "A computer hacker learns that reality as he knows it is actually a simulation, and he must fight to free humanity from the machines."
  },
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO."
  },
  {
    title: "The Dark Knight",
    description: "Batman faces his greatest challenge yet when the Joker wreaks havoc on Gotham City, forcing him to confront his own moral boundaries."
  },
  {
    title: "Parasite",
    description: "A poor family schemes to become employed by a wealthy family and infiltrate their household by posing as unrelated, highly qualified individuals."
  },
  {
    title: "Spirited Away",
    description: "A young girl becomes trapped in a mysterious spirit world and must find a way to save her parents and return to the human world."
  }
];

async function embedMovies() {
  let embedder;
  
  console.log('🤖 Initializing Hugging Face embedding model...');
  
  // Try to load the embedding model with retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        cache_dir: './models',
        local_files_only: false
      });
      console.log('✅ Embedding model loaded successfully!');
      break;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === 3) {
        console.log('🔧 Troubleshooting tips:');
        console.log('   1. Check your internet connection');
        console.log('   2. Try running with VPN if blocked');
        console.log('   3. Try again later (Hugging Face servers might be busy)');
        return;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Get movies data (TMDB or mock)
  let movies;
  if (USE_TMDB) {
    try {
      console.log('🌐 Fetching movies from TMDB...');
      movies = await tmdbService.getDiverseMovieCollection();
      console.log(`✅ Fetched ${movies.length} movies from TMDB`);
    } catch (error) {
      console.error('❌ Failed to fetch TMDB data, falling back to mock data:', error.message);
      movies = mockMovies;
    }
  } else {
    console.log('📚 Using mock movie data...');
    movies = mockMovies;
  }

  console.log(`🎬 Processing ${movies.length} movies...`);

  // Clear existing data first
  console.log('🗑️ Clearing existing movie data...');
  const { error: deleteError } = await supabase
    .from('movies_hf')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.error('❌ Error clearing existing data:', deleteError);
  } else {
    console.log('✅ Existing data cleared');
  }

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    console.log(`Processing ${i + 1}/${movies.length}: ${movie.title}`);

    try {
      // Generate embedding using Hugging Face
      const embedding = await embedder(movie.description, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Convert to array
      const embeddingArray = Array.from(embedding.data);
      
      // Prepare movie data for insertion
      const movieData = {
        title: movie.title,
        description: movie.description,
        embedding: embeddingArray  // Supabase will automatically convert to JSONB
      };

      // Add TMDB-specific fields if available
      if (movie.tmdb_id) {
        movieData.tmdb_id = movie.tmdb_id;
        movieData.poster_url = movie.poster_url;
        movieData.backdrop_url = movie.backdrop_url;
        movieData.release_date = movie.release_date;
        movieData.vote_average = movie.vote_average;
        movieData.vote_count = movie.vote_count;
        movieData.genre_ids = movie.genre_ids;
        movieData.popularity = movie.popularity;
      }
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('movies_hf')
        .insert(movieData);

      if (error) {
        console.error(`❌ Error inserting ${movie.title}:`, error.message);
      } else {
        console.log(`✅ Embedded and stored: ${movie.title}`);
      }
      
      // Small delay to be nice to Supabase and TMDB
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Error processing ${movie.title}:`, error.message);
    }
  }

  console.log('🎉 All movies embedded and stored in Supabase!');
  console.log('💡 You can now start the server and get recommendations!');
  console.log('🔗 Backend will run on http://localhost:5001');
  
  // Test a quick recommendation
  if (movies.length > 0) {
    console.log('\n🧪 Testing recommendation system...');
    try {
      const testQuery = "I want an action movie with great visuals and amazing fight scenes";
      const testEmbedding = await embedder(testQuery, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Fetch all movies to test similarity
      const { data: allMovies, error } = await supabase
        .from('movies_hf')
        .select('*');
        
      if (error) {
        console.error('❌ Error fetching movies for test:', error);
      } else {
        // Simple cosine similarity test
        const similarities = allMovies.map(movie => {
          const movieEmbedding = movie.embedding;
          let similarity = 0;
          for (let i = 0; i < testEmbedding.data.length; i++) {
            similarity += testEmbedding.data[i] * movieEmbedding[i];
          }
          return { ...movie, similarity };
        });
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topRec = similarities[0];
        console.log(`🎯 Top recommendation for "${testQuery}": ${topRec.title} (similarity: ${topRec.similarity.toFixed(3)})`);
      }
    } catch (error) {
      console.error('❌ Error testing recommendations:', error);
    }
  }
}

embedMovies().catch(console.error);