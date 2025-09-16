const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
const movies = require("../movies.json"); // no assert needed
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Debug: Check if environment variables are loaded
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Loaded" : "✗ Missing");
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✓ Loaded" : "✗ Missing");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ Loaded" : "✗ Missing");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Helper function to add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log(`Processing ${movies.length} movies with rate limiting...`);
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    
    try {
      console.log(`Processing ${i + 1}/${movies.length}: ${movie.title}`);
      
      const embedding = await embedText(movie.description);
      await supabase.from("movies").insert({
        title: movie.title,
        description: movie.description,
        embedding
      });
      
      console.log(`✓ Inserted: ${movie.title}`);
      
      // Add delay between requests (10 seconds to respect rate limits)
      if (i < movies.length - 1) {
        console.log("Waiting 10 seconds before next request...");
        await delay(10000);
      }
      
    } catch (error) {
      console.error(`Error processing ${movie.title}:`, error.message);
      
      if (error.status === 429) {
        console.log("Rate limit hit. Waiting 60 seconds before retrying...");
        await delay(60000);
        i--; // Retry the same movie
      }
    }
  }
  
  console.log("All movies processed!");
})();
