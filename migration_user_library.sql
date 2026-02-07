-- ==========================================
-- МИГРАЦИЯ: ПУБЛИЧНАЯ БИБЛИОТЕКА (ЛАЙКИ И КОЛЛЕКЦИЯ)
-- Запускать в Supabase SQL Editor
-- ==========================================

-- 1. ТАБЛИЦА ЛАЙКОВ (WISHLIST)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, track_id) -- Один пользователь не может лайкнуть один трек дважды
);

-- 2. ТАБЛИЦА КОЛЛЕКЦИИ (КУПЛЕННЫЕ ТРЕКИ)
CREATE TABLE IF NOT EXISTS public.user_collection (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, track_id)
);

-- 3. ОТКЛЮЧЕНИЕ RLS (Для разработки)
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection DISABLE ROW LEVEL SECURITY;
