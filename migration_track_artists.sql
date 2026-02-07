-- ==========================================
-- MIGRATION: TRACK ARTIST TAGGING SYSTEM
-- ==========================================

-- 1. Create junction table for linking tracks to multiple artists (profiles)
CREATE TABLE IF NOT EXISTS public.track_artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(track_id, artist_id)
);

-- 2. Disable RLS for development
ALTER TABLE public.track_artists DISABLE ROW LEVEL SECURITY;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_track_artists_track_id ON public.track_artists(track_id);
CREATE INDEX IF NOT EXISTS idx_track_artists_artist_id ON public.track_artists(artist_id);
