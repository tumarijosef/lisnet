-- Function to safely submit artist application
-- bypassing RLS policies (SECURITY DEFINER)
-- This is necessary because Telegram users might not have a Supabase Auth session
CREATE OR REPLACE FUNCTION submit_artist_application(
    p_user_id UUID,
    p_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Check if application already exists to avoid duplicates
    IF EXISTS (
        SELECT 1 FROM public.artist_applications 
        WHERE user_id = p_user_id AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Pending application already exists';
    END IF;

    INSERT INTO public.artist_applications (user_id, type, status)
    VALUES (p_user_id, p_type, 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limit access
GRANT EXECUTE ON FUNCTION submit_artist_application TO anon;
GRANT EXECUTE ON FUNCTION submit_artist_application TO authenticated;
GRANT EXECUTE ON FUNCTION submit_artist_application TO service_role;
