-- 1. ТАБЛИЦА ПЛЕЙЛИСТОВ
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ТАБЛИЦА ТРЕКОВ В ПЛЕЙЛИСТАХ
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(playlist_id, track_id)
);

-- 3. ОТКЛЮЧЕНИЕ RLS
ALTER TABLE public.playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks DISABLE ROW LEVEL SECURITY;

-- 4. ТРИГГЕР ДЛЯ ОБНОВЛЕНИЯ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
