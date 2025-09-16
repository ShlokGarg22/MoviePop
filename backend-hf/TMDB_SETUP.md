# TMDB API Integration Setup

## 🎬 TMDB API Integration

This guide helps you integrate The Movie Database (TMDB) API to get real movie data with posters, ratings, and metadata.

### Step 1: Get TMDB API Key

1. Go to [TMDB](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Fill out the form (you can use "Personal/Educational" for usage)
6. Copy your API key

### Step 2: Configure Environment

1. Open `backend-hf/.env`
2. Replace `your_tmdb_api_key_here` with your actual API key:
   ```
   TMDB_API_KEY=your_actual_api_key_here
   ```

### Step 3: Update Database Schema

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the script from `backend-hf/database/update_schema.sql`:
   ```sql
   -- Add new columns for TMDB data
   ALTER TABLE movies_hf 
   ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
   ADD COLUMN IF NOT EXISTS poster_url TEXT,
   ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
   ADD COLUMN IF NOT EXISTS release_date DATE,
   ADD COLUMN IF NOT EXISTS vote_average DECIMAL(3,1),
   ADD COLUMN IF NOT EXISTS vote_count INTEGER,
   ADD COLUMN IF NOT EXISTS genre_ids JSONB,
   ADD COLUMN IF NOT EXISTS popularity DECIMAL(10,3);

   -- Add indexes
   CREATE INDEX IF NOT EXISTS idx_movies_hf_tmdb_id ON movies_hf(tmdb_id);
   CREATE INDEX IF NOT EXISTS idx_movies_hf_vote_average ON movies_hf(vote_average);
   CREATE INDEX IF NOT EXISTS idx_movies_hf_popularity ON movies_hf(popularity);
   ```

### Step 4: Run TMDB Embedding Script

```bash
cd backend-hf
npm run embed-tmdb
```

This will:
- Fetch ~50+ diverse movies from TMDB
- Generate embeddings for each movie
- Store in Supabase with full metadata

### Step 5: Start the Server

```bash
cd backend-hf
npm start
```

### Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

## 🎯 What You'll Get

### Enhanced Movie Cards
- **Movie Posters**: High-quality images from TMDB
- **Release Year**: When the movie was released
- **TMDB Rating**: User ratings with vote counts
- **Popularity Score**: How trending the movie is
- **Group Match**: Your AI-powered similarity score

### Real Movie Database
- Popular movies from TMDB
- Top-rated classics
- Movies across multiple genres (Action, Comedy, Drama, Horror, Romance, Sci-Fi)
- Fresh data with real movie metadata

### Better Recommendations
- Same powerful local AI embeddings
- Real movie descriptions and data
- Visual movie browsing experience
- Enhanced metadata for better matching

## 🔧 Scripts Available

- `npm run embed-tmdb` - Fetch and embed TMDB movies
- `npm run embed-mock` - Use original mock data (fallback)
- `npm start` - Start the recommendation server

## 🚀 Features

### TMDB Service (`tmdbService.js`)
- Fetch popular movies
- Get top-rated classics  
- Browse by genre
- Search functionality
- Movie details with metadata

### Updated Database Schema
- TMDB ID for movie linking
- Poster and backdrop URLs
- Release dates and ratings
- Genre classifications
- Popularity metrics

### Enhanced Frontend
- Movie poster display
- Release year showing
- Star ratings with vote counts
- Popularity indicators
- Responsive mobile layout

Enjoy your AI-powered movie recommender with real movie data! 🍿