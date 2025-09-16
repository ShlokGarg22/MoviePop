import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://movie-night-app.netlify.app',  // Common Netlify naming pattern
        'https://*.netlify.app',  // Allow any Netlify subdomain
        'https://netlify.app',    // Allow direct netlify.app
        '*'  // Temporary: Allow all origins for testing
      ]
    : [
        'http://localhost:5173',
        'http://localhost:3000'
      ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize embedding pipeline (loads once)
let embedder = null;

const initializeEmbedder = async () => {
  if (!embedder) {
    console.log('Loading Hugging Face embedding model...');
    
    // Set cache directory
    process.env.HF_HUB_CACHE = './models';
    
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      cache_dir: './models',
      local_files_only: false,
      revision: 'main'
    });
    console.log('✓ Embedding model loaded!');
  }
  return embedder;
};

// Utility function to calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Get recommendations endpoint
app.post('/api/recommend', async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers || answers.length === 0) {
      return res.status(400).json({ error: 'No preferences provided' });
    }

    // Initialize embedder
    const embedder = await initializeEmbedder();

    // Combine all user preferences
    const userText = answers.map(a => a.description).join(' ');
    
    // Generate embedding for user preferences
    const userEmbedding = await embedder(userText, { pooling: 'mean', normalize: true });
    const userVector = Array.from(userEmbedding.data);

    // Get all movies from Supabase
    const { data: movies, error } = await supabase
      .from('movies_hf')
      .select('*');
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!movies || movies.length === 0) {
      return res.status(404).json({ error: 'No movies found. Please run embedding script first.' });
    }

    // Calculate similarities
    const recommendations = movies.map(movie => {
      // Parse JSON embedding back to array
      const movieVector = Array.isArray(movie.embedding) 
        ? movie.embedding 
        : JSON.parse(movie.embedding);
      const similarity = cosineSimilarity(userVector, movieVector);
      
      return {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        similarity,
        // Include TMDB metadata if available
        ...(movie.tmdb_id && {
          tmdb_id: movie.tmdb_id,
          poster_url: movie.poster_url,
          backdrop_url: movie.backdrop_url,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          genre_ids: movie.genre_ids,
          popularity: movie.popularity
        })
      };
    });

    // Sort by similarity and return top recommendations
    recommendations.sort((a, b) => b.similarity - a.similarity);
    
    res.json({ 
      recommendations: recommendations.slice(0, 5),
      message: `Found ${recommendations.length} movies, showing top matches`,
      backend: 'Hugging Face + Supabase'
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    backend: 'Hugging Face Transformers.js + Supabase',
    embedding_model: 'Xenova/all-MiniLM-L6-v2'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend-HF running on http://localhost:${PORT}`);
  console.log('🤖 Using Hugging Face local embeddings + Supabase storage');
  console.log('📊 Model: Xenova/all-MiniLM-L6-v2');
});