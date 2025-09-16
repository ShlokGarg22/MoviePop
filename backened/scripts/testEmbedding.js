const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Debug: Check if environment variables are loaded
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Loaded" : "✗ Missing");
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✓ Loaded" : "✗ Missing");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✓ Loaded" : "✗ Missing");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testEmbedding() {
  try {
    console.log("Testing Gemini API connection...");
    
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent("This is a test");
    
    console.log("✓ Gemini API works! Embedding dimension:", result.embedding.values.length);
    
    // Test Supabase connection
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from("movies").select("count").limit(1);
    
    if (error) {
      console.log("✗ Supabase error:", error.message);
    } else {
      console.log("✓ Supabase connection works!");
    }
    
    return true;
  } catch (error) {
    console.error("✗ Error:", error.message);
    return false;
  }
}

(async () => {
  const success = await testEmbedding();
  if (success) {
    console.log("\n🎉 Both APIs are working! You can now run embedMovies.js");
  } else {
    console.log("\n❌ There are API issues to resolve first.");
  }
})();