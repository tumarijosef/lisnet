-- Function to safely update user profile for Telegram users
-- bypassing RLS policies (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_telegram_user_profile(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Update only provided fields (COALESCE isn't quite right here if we want to allow setting NULL, 
    -- but usually we update with specific values. If passed as NULL, we assume no change for simplicity in this specific app context, 
    -- or we use dynamic SQL. A simpler approach for this app is checking if null.)
    
    UPDATE public.profiles
    SET 
        full_name = COALESCE(p_full_name, full_name),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        username = COALESCE(p_username, username),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Return the updated profile
    SELECT row_to_json(p) INTO v_result
    FROM public.profiles p
    WHERE id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION update_telegram_user_profile TO anon;
GRANT EXECUTE ON FUNCTION update_telegram_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_telegram_user_profile TO service_role;
