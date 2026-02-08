
-- Окончательная и самая мощная версия функции удаления (v1.4.1)
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID, admin_tg_id BIGINT)
RETURNS void AS $$
DECLARE
    found_admin_id UUID;
BEGIN
    -- 1. СТРОГАЯ ПРОВЕРКА ПРАВ
    SELECT id FROM public.profiles 
    WHERE telegram_id = admin_tg_id AND role = 'admin'
    INTO found_admin_id;

    IF found_admin_id IS NULL THEN
        RAISE EXCEPTION 'Access denied. The ID received (%) is not an admin.', admin_tg_id;
    END IF;

    -- 2. КАСКАДНАЯ ОЧИСТКА ДАННЫХ (с проверкой существования таблиц)
    
    -- Очистка библиотеки Треки
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        DELETE FROM public.likes WHERE user_id = target_user_id;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_collection') THEN
        DELETE FROM public.user_collection WHERE user_id = target_user_id;
    END IF;

    -- Очистка плейлистов
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'playlists') THEN
        DELETE FROM public.playlists WHERE user_id = target_user_id;
    END IF;

    -- Очистка уведомлений
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DELETE FROM public.notifications WHERE user_id = target_user_id;
    END IF;

    -- Очистка заявок
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_applications') THEN
        DELETE FROM public.artist_applications WHERE user_id = target_user_id;
    END IF;

    -- Очистка постов
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
        DELETE FROM public.community_posts WHERE user_id = target_user_id;
    END IF;

    -- 3. УДАЛЕНИЕ ПРОФИЛЯ
    DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
