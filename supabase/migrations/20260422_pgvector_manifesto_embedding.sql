-- MetaCreate P0-3 — Vision Alignment (pgvector + manifesto embedding columns)
-- Run in Supabase SQL editor / migrations pipeline.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manifesto_embedding vector(1024),
  ADD COLUMN IF NOT EXISTS manifesto_embedding_updated_at timestamptz;

-- Optional helper index for track filtering in matching
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_track
  ON public.profiles (onboarding_complete, hackathon_track);

