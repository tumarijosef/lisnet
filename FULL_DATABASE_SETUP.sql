-- ==========================================
-- ПОЛНЫЙ СКРИПТ НАСТРОЙКИ БАЗЫ ДАННЫХ LISNET
-- Запускать в Supabase SQL Editor
-- ВНИМАНИЕ: Этот скрипт удалит старые данные и создаст чистую структуру
-- ==========================================

-- 1. Включаем расширение для генерации UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ОЧИСТКА (Удаляем старые таблицы, чтобы исключить конфликты)
DROP TABLE IF EXISTS public.tracks CASCADE;
DROP TABLE IF EXISTS public.releases CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. СОЗДАНИЕ ТАБЛИЦЫ ПРОФИЛЕЙ (Поддержка Telegram)
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT UNIQUE, -- Уникальный ID из Telegram
  username TEXT,            -- Telegram @username
  full_name TEXT,            -- Имя пользователя
  avatar_url TEXT,           -- Ссылка на аватар
  role TEXT CHECK (role IN ('admin', 'user', 'artist')) DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. СОЗДАНИЕ ТАБЛИЦЫ РЕЛИЗОВ
CREATE TABLE public.releases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00,
    genre TEXT DEFAULT 'Electronic',
    is_published BOOLEAN DEFAULT true
);

-- 5. СОЗДАНИЕ ТАБЛИЦЫ ТРЕКОВ
CREATE TABLE public.tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    release_id UUID REFERENCES public.releases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist_name TEXT,
    audio_url TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0
);

-- 6. ОТКЛЮЧЕНИЕ RLS (Для разработки)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks DISABLE ROW LEVEL SECURITY;

-- 7. НАСТРОЙКА ХРАНИЛИЩА (STORAGE BUCKETS)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('images', 'images', true), 
    ('audio-files', 'audio-files', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Политики доступа
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;

CREATE POLICY "Public Images Access" ON storage.objects FOR ALL USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public Audio Access" ON storage.objects FOR ALL USING (bucket_id = 'audio-files') WITH CHECK (bucket_id = 'audio-files');
CREATE POLICY "Public Avatars Access" ON storage.objects FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

UPDATE storage.buckets SET public = true WHERE id IN ('images', 'audio-files', 'avatars');
