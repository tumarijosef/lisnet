-- ==========================================
-- МИГРАЦИЯ: УВЕДОМЛЕНИЯ (NOTIFICATIONS)
-- Запускать в Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Кому уведомление
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Кто совершил действие
    type TEXT NOT NULL, -- 'follow', 'like', 'comment'
    data JSONB DEFAULT '{}'::jsonb, -- Дополнительные данные
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ОТКЛЮЧЕНИЕ RLS (Для разработки)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
