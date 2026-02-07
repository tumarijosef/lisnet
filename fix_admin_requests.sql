-- Function to fetch pending artist applications with user details
-- bypassing RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_admin_requests()
RETURNS TABLE (
    id UUID,
    type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.status,
        a.created_at,
        p.id AS user_id,
        p.full_name,
        p.avatar_url,
        p.username
    FROM public.artist_applications a
    JOIN public.profiles p ON a.user_id = p.id
    WHERE a.status = 'pending'
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process artist application (approve/reject)
CREATE OR REPLACE FUNCTION process_artist_application(
    p_application_id UUID,
    p_status TEXT,
    p_user_id UUID,
    p_admin_id UUID -- Optional: passed for audit, though not strictly used in logic below
)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
BEGIN
    -- 1. Get application type
    SELECT type INTO v_type FROM public.artist_applications WHERE id = p_application_id;

    -- 2. Update application status
    UPDATE public.artist_applications
    SET status = p_status, updated_at = NOW()
    WHERE id = p_application_id;

    -- 3. If approved, update profile
    IF p_status = 'approved' THEN
        UPDATE public.profiles
        SET 
            role = 'artist',
            artist_type = v_type,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- 4. Create notification
        INSERT INTO public.notifications (user_id, type, data)
        VALUES (
            p_user_id, 
            'system', 
            json_build_object(
                'title', 'Application Approved!',
                'message', 'Congratulations! Your request to become a ' || v_type || ' has been approved.'
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_admin_requests TO anon;
GRANT EXECUTE ON FUNCTION get_admin_requests TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_requests TO service_role;

GRANT EXECUTE ON FUNCTION process_artist_application TO anon;
GRANT EXECUTE ON FUNCTION process_artist_application TO authenticated;
GRANT EXECUTE ON FUNCTION process_artist_application TO service_role;
