-- Update the movies_hf table to include TMDB fields

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

-- Add index on TMDB ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_movies_hf_tmdb_id ON movies_hf(tmdb_id);

-- Add index on vote_average for sorting
CREATE INDEX IF NOT EXISTS idx_movies_hf_vote_average ON movies_hf(vote_average);

-- Add index on popularity for sorting
CREATE INDEX IF NOT EXISTS idx_movies_hf_popularity ON movies_hf(popularity);

-- Show the updated table structure
\d movies_hf;