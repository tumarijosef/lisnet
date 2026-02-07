-- ==========================================
-- МИГРАЦИЯ: СИСТЕМА ЗАЯВОК НА АРТИСТА/ЛЕЙБЛ
-- ==========================================

-- 1. Таблица заявок
CREATE TABLE IF NOT EXISTS public.artist_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('artist', 'label')) DEFAULT 'artist',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Отключаем RLS для разработки
ALTER TABLE public.artist_applications DISABLE ROW LEVEL SECURITY;

-- 2. Добавляем колонку в профиль для типа контента (лейбл или артист)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS artist_type TEXT CHECK (artist_type IN ('none', 'artist', 'label')) DEFAULT 'none';

-- 3. Обновляем статус артиста для тех, кто уже в роли artist (по умолчанию artist)
UPDATE public.profiles SET artist_type = 'artist' WHERE role = 'artist' AND artist_type = 'none';
