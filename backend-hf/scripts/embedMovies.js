import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Sample movies data
const movies = [
  {
    title: "The Matrix",
    description: "A computer hacker learns that reality as he knows it is actually a simulation, and he must fight to free humanity from the machines."
  },
  {
    title: "Inception",
    description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO."
  },
  {
    title: "The Shawshank Redemption",
    description: "Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency in a corrupt prison."
  },
  {
    title: "Pulp Fiction",
    description: "Multiple intertwining stories about crime, redemption, and the seedy underworld of Los Angeles, told in a non-linear narrative."
  },
  {
    title: "The Dark Knight",
    description: "Batman faces his greatest challenge yet when the Joker wreaks havoc on Gotham City, forcing him to confront his own moral boundaries."
  },
  {
    title: "Forrest Gump",
    description: "A simple man with a low IQ experiences extraordinary events throughout American history while teaching valuable life lessons."
  },
  {
    title: "Titanic",
    description: "A tragic love story unfolds aboard the doomed ship, showcasing both human resilience and the devastating power of nature."
  },
  {
    title: "The Godfather",
    description: "The aging patriarch of a crime dynasty transfers control to his reluctant son in this epic tale of power, family, and betrayal."
  }
];

async function embedMovies() {
  console.log('🤖 Starting Hugging Face embedding process with Supabase...');
  
  // Set environment variables for better network handling
  process.env.HF_HUB_DISABLE_PROGRESS_BARS = '1';
  process.env.HF_HUB_CACHE = './models';
  
  // Check Supabase connection
  const { data: testData, error: testError } = await supabase
    .from('movies_hf')
    .select('count')
    .limit(1);
    
  if (testError) {
    console.error('❌ Supabase connection failed:', testError.message);
    console.log('💡 Make sure to:');
    console.log('   1. Update your .env file with correct SUPABASE_URL and SUPABASE_KEY');
    console.log('   2. Create the movies_hf table in Supabase');
    return;
  }
  
  console.log('✅ Supabase connection successful');

  // Clear existing data
  const { error: deleteError } = await supabase
    .from('movies_hf')
    .delete()
    .gte('id', 0);
    
  if (deleteError) {
    console.error('⚠️  Warning: Could not clear existing data:', deleteError.message);
  } else {
    console.log('🗑️  Cleared existing movies');
  }

  // Initialize embedding model with retry logic
  console.log('📥 Loading Hugging Face embedding model...');
  console.log('⏳ This may take a few minutes on first download...');
  
  let embedder = null;
  let retries = 3;
  
  while (retries > 0 && !embedder) {
    try {
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        cache_dir: './models',
        local_files_only: false,
        revision: 'main'
      });
      console.log('✅ Model loaded successfully!');
      break;
    } catch (error) {
      retries--;
      console.log(`❌ Download failed. Retries left: ${retries}`);
      if (retries > 0) {
        console.log('⏳ Waiting 5 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('❌ Failed to download model after all retries:', error.message);
        console.log('💡 Possible solutions:');
        console.log('   1. Check your internet connection');
        console.log('   2. Try running with VPN if blocked');
        console.log('   3. Try again later (Hugging Face servers might be busy)');
        return;
      }
    }
  }

  console.log(`🎬 Processing ${movies.length} movies...`);

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
      
      // Insert into Supabase with JSON embedding
      const { data, error } = await supabase
        .from('movies_hf')
        .insert({
          title: movie.title,
          description: movie.description,
          embedding: embeddingArray  // Supabase will automatically convert to JSONB
        });

      if (error) {
        console.error(`❌ Error inserting ${movie.title}:`, error.message);
      } else {
        console.log(`✅ Embedded and stored: ${movie.title}`);
      }
      
      // Small delay to be nice to Supabase
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing ${movie.title}:`, error.message);
    }
  }

  console.log('🎉 All movies embedded and stored in Supabase!');
  console.log('💡 You can now start the server and get recommendations!');
  console.log('🔗 Backend will run on http://localhost:5001');
}

embedMovies().catch(console.error);