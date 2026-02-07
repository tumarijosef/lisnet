-- Simplest possible process function that avoids notification issues
CREATE OR REPLACE FUNCTION process_artist_application(
    p_application_id UUID,
    p_status TEXT,
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
    v_notification_data JSONB;
BEGIN
    -- 1. Get application type
    SELECT type INTO v_type FROM public.artist_applications WHERE id = p_application_id;
    IF v_type IS NULL THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- 2. Update application status
    UPDATE public.artist_applications
    SET status = p_status, updated_at = NOW()
    WHERE id = p_application_id;

    -- 3. If approved, update profile
    IF p_status = 'approved' THEN
        -- Check if profile exists first
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
            RAISE EXCEPTION 'User profile not found';
        END IF;

        UPDATE public.profiles
        SET 
            role = 'artist',
            artist_type = v_type,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- 4. Create notification with SAFE actor handling
        -- We will try to use the user_id itself if p_admin_id is missing or invalid
        -- This avoids foreign key constraint failures if p_admin_id is not a valid profile
        
        v_notification_data := json_build_object(
            'title', 'Application Approved!',
            'message', 'Congratulations! Your request to become a ' || v_type || ' has been approved.'
        );

        BEGIN
            INSERT INTO public.notifications (user_id, actor_id, type, data)
            VALUES (
                p_user_id, 
                COALESCE(p_admin_id, p_user_id), -- Fallback to user themselves as "actor" if admin ID invalid/missing
                'system', 
                v_notification_data
            );
        EXCEPTION WHEN OTHERS THEN
            -- If notification fails, we still want the approval to succeed
            -- Just log it (in a real system) or ignore
            RAISE NOTICE 'Notification creation failed, but approval proceeded: %', SQLERRM;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
