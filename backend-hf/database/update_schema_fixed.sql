-- ==========================================
-- TMDB Integration Schema Update (Fixed)
-- ==========================================

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'movies_hf' 
ORDER BY ordinal_position;

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

-- Add comments to document the new columns
COMMENT ON COLUMN movies_hf.tmdb_id IS 'The Movie Database unique identifier';
COMMENT ON COLUMN movies_hf.poster_url IS 'URL for movie poster image from TMDB';
COMMENT ON COLUMN movies_hf.backdrop_url IS 'URL for movie backdrop image from TMDB';
COMMENT ON COLUMN movies_hf.release_date IS 'Movie release date';
COMMENT ON COLUMN movies_hf.vote_average IS 'TMDB user rating (0-10)';
COMMENT ON COLUMN movies_hf.vote_count IS 'Number of votes on TMDB';
COMMENT ON COLUMN movies_hf.genre_ids IS 'Array of TMDB genre IDs';
COMMENT ON COLUMN movies_hf.popularity IS 'TMDB popularity score';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_hf_tmdb_id ON movies_hf(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_hf_vote_average ON movies_hf(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_movies_hf_popularity ON movies_hf(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_movies_hf_release_date ON movies_hf(release_date DESC);

-- Create a composite index for filtering by rating and popularity
CREATE INDEX IF NOT EXISTS idx_movies_hf_rating_popularity 
ON movies_hf(vote_average DESC, popularity DESC);

-- Add constraint to ensure vote_average is between 0 and 10
ALTER TABLE movies_hf 
ADD CONSTRAINT chk_vote_average 
CHECK (vote_average IS NULL OR (vote_average >= 0 AND vote_average <= 10));

-- Add constraint to ensure vote_count is non-negative
ALTER TABLE movies_hf 
ADD CONSTRAINT chk_vote_count 
CHECK (vote_count IS NULL OR vote_count >= 0);

-- Add constraint to ensure popularity is non-negative
ALTER TABLE movies_hf 
ADD CONSTRAINT chk_popularity 
CHECK (popularity IS NULL OR popularity >= 0);

-- Verify the updated table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'movies_hf' 
ORDER BY ordinal_position;

-- Show all indexes on the table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'movies_hf'
ORDER BY indexname;

-- Show table constraints (FIXED - removed ambiguous column reference)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'movies_hf'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Sample query to test the new structure
SELECT 
    title,
    vote_average,
    vote_count,
    popularity,
    release_date,
    poster_url IS NOT NULL as has_poster
FROM movies_hf 
WHERE tmdb_id IS NOT NULL
ORDER BY vote_average DESC NULLS LAST, popularity DESC NULLS LAST
LIMIT 5;