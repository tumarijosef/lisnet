-- Добавление колонки видимости для плейлистов
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Обновление существующих плейлистов (опционально, они и так будут false по умолчанию)
-- UPDATE public.playlists SET is_public = false WHERE is_public IS NULL;
