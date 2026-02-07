-- Function to safely register or login a Telegram user
-- bypassing RLS policies (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION register_telegram_user(
    p_telegram_id BIGINT,
    p_username TEXT,
    p_full_name TEXT,
    p_avatar_url TEXT
)
RETURNS json AS $$
DECLARE
    v_profile_id UUID;
    v_result json;
BEGIN
    -- 1. Try to find existing user
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE telegram_id = p_telegram_id;

    IF v_profile_id IS NULL THEN
        -- 2. Create new profile if not found
        INSERT INTO public.profiles (
            telegram_id, 
            username, 
            full_name, 
            avatar_url, 
            role,
            status
        )
        VALUES (
            p_telegram_id, 
            p_username, 
            p_full_name, 
            p_avatar_url, 
            'user',
            'active'
        )
        RETURNING id INTO v_profile_id;
    ELSE
        -- 3. Update existing profile (sync latest info)
        UPDATE public.profiles
        SET 
            username = p_username,
            full_name = p_full_name,
            avatar_url = p_avatar_url,
            updated_at = NOW()
        WHERE id = v_profile_id;
    END IF;

    -- 4. Return the full profile
    SELECT row_to_json(p) INTO v_result
    FROM public.profiles p
    WHERE id = v_profile_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anonymous users (since we call this from client without session)
GRANT EXECUTE ON FUNCTION register_telegram_user TO anon;
GRANT EXECUTE ON FUNCTION register_telegram_user TO authenticated;
GRANT EXECUTE ON FUNCTION register_telegram_user TO service_role;
