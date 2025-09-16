const { createClient } = require("@supabase/supabase-js");
const movies = require("../movies.json");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Debug: Check if environment variables are loaded
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Loaded" : "✗ Missing");
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✓ Loaded" : "✗ Missing");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Mock embedding function - creates simple embeddings based on keywords
function createMockEmbedding(text) {
  const keywords = {
    'action': [0.8, 0.2, 0.1, 0.9, 0.3],
    'thriller': [0.7, 0.8, 0.3, 0.6, 0.9],
    'comedy': [0.2, 0.9, 0.8, 0.1, 0.4],
    'romance': [0.1, 0.3, 0.9, 0.2, 0.8],
    'sci-fi': [0.9, 0.1, 0.2, 0.8, 0.7],
    'space': [0.9, 0.2, 0.1, 0.7, 0.6],
    'mind': [0.6, 0.7, 0.4, 0.8, 0.5],
    'family': [0.3, 0.8, 0.7, 0.2, 0.6],
    'culture': [0.4, 0.6, 0.8, 0.3, 0.7]
  };
  
  const textLower = text.toLowerCase();
  let embedding = new Array(768).fill(0.1); // Create 768-dimensional vector
  
  // Add keyword-based values to first few dimensions
  let index = 0;
  for (const [keyword, values] of Object.entries(keywords)) {
    if (textLower.includes(keyword)) {
      for (let i = 0; i < values.length && index < 768; i++, index++) {
        embedding[index] = values[i];
      }
    }
  }
  
  // Fill remaining with random values for uniqueness
  for (let i = index; i < 768; i++) {
    embedding[i] = Math.random() * 0.5 + 0.1;
  }
  
  return embedding;
}

(async () => {
  console.log(`Processing ${movies.length} movies with mock embeddings...`);
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    
    try {
      console.log(`Processing ${i + 1}/${movies.length}: ${movie.title}`);
      
      const embedding = createMockEmbedding(movie.description);
      const { data, error } = await supabase.from("movies").insert({
        title: movie.title,
        description: movie.description,
        embedding
      });
      
      if (error) {
        console.error(`Error inserting ${movie.title}:`, error.message);
      } else {
        console.log(`✓ Inserted: ${movie.title}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${movie.title}:`, error.message);
    }
  }
  
  console.log("All movies processed with mock embeddings!");
})();