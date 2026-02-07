-- ==========================================
-- МИГРАЦИЯ: СИСТЕМА ПОДПИСОК (FOLLOWERS / FOLLOWING)
-- Запускать в Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id) -- Нельзя подписаться дважды
);

-- ОТКЛЮЧЕНИЕ RLS (Для разработки)
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
