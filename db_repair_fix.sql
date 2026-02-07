-- ==========================================
-- СКРИПТ ИСПРАВЛЕНИЯ БАЗЫ ДАННЫХ (REPAIR)
-- Запустите это в Supabase SQL Editor
-- ==========================================

-- 1. Добавляем колонку artist_id в таблицу релизов, если её нет
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='releases' AND column_name='artist_id') THEN
        ALTER TABLE public.releases ADD COLUMN artist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Убеждаемся, что таблица заявок существует и настроена
CREATE TABLE IF NOT EXISTS public.artist_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('artist', 'label')) DEFAULT 'artist',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.artist_applications DISABLE ROW LEVEL SECURITY;

-- 3. Убеждаемся, что в профилях есть artist_type
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='artist_type') THEN
        ALTER TABLE public.profiles ADD COLUMN artist_type TEXT CHECK (artist_type IN ('none', 'artist', 'label')) DEFAULT 'none';
    END IF;
END $$;

-- 4. Сброс кэша схемы Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
