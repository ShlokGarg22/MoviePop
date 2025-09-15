import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { cosineSimilarity } from '../utils/similarity.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const googleApiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI({ apiKey: googleApiKey });

async function embedAnswer(text){
    const model = genAI.getGenerativeModel({model:'embedding-gecko-001'});
    const result = await model.embedContent(text);
    return result.embedding.values;
}

router.post("/", async (req, res) => {
  try {
    const { answers } = req.body; // array of user descriptions

    // 1. Embed each answer
    const embeddings = [];
    for (const ans of answers) {
      const e = await embedAnswer(ans.description);
      embeddings.push(e);
    }

    // 2. Average embedding (group mood)
    const avgEmbedding = embeddings[0].map((_, i) =>
      embeddings.reduce((sum, e) => sum + e[i], 0) / embeddings.length
    );

    // 3. Fetch all movies
    const { data: movies, error } = await supabase.from("movies").select("*");
    if (error) throw error;

    // 4. Compute similarity
    const scored = movies.map(movie => {
      const sim = cosineSimilarity(avgEmbedding, movie.embedding);
      return { ...movie, similarity: sim };
    });

    // 5. Sort descending
    scored.sort((a, b) => b.similarity - a.similarity);

    // 6. Return top 5
    res.json({ recommendations: scored.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
