# Backend-HF (Hugging Face Embeddings)

Alternative backend using **Hugging Face Transformers.js** for local embeddings and **Supabase** for storage.

## Features
- 🤖 Local AI embeddings using `Xenova/all-MiniLM-L6-v2`
- 📊 No external API calls for embeddings (runs locally)
- 🗄️ Supabase for reliable cloud storage
- ⚡ Fast inference with pre-trained models

## Setup

1. **Install dependencies**
   ```bash
   cd backend-hf
   npm install
   ```

2. **Configure environment**
   ```bash
   # Copy and update .env file
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_key
   PORT=5001
   ```

3. **Create Supabase table**
   ```sql
   CREATE TABLE movies_hf (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     embedding VECTOR(384)  -- Hugging Face model outputs 384 dimensions
   );
   ```

4. **Generate embeddings**
   ```bash
   npm run embed
   ```

5. **Start server**
   ```bash
   npm start
   ```

## API Usage

Same as the original backend, but runs on port **5001**:

```bash
POST http://localhost:5001/api/recommend
```

## Advantages
- ✅ No API rate limits or costs
- ✅ Works offline after initial model download
- ✅ Consistent embeddings (deterministic)
- ✅ Privacy-friendly (no data sent to external APIs)