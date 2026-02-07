-- Refined process_artist_application to handle notification actor_id constraints
CREATE OR REPLACE FUNCTION process_artist_application(
    p_application_id UUID,
    p_status TEXT,
    p_user_id UUID,
    p_admin_id UUID -- Optional: passed for audit, used as actor_id if provided
)
RETURNS VOID AS $$
DECLARE
    v_type TEXT;
    v_actor_id UUID;
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

        -- 4. Create notification ONLY if foreign key constraint is satisfied or nullable
        -- Check if actor_id column allows NULL or if we have a valid admin ID
        -- For simplicity in this fix, we will try to safe insert or omit actor_id if possible
        
        -- If p_admin_id is NULL, we might fail foreign key on actor_id if it's NOT NULL.
        -- Let's check table definition or just try to insert without actor_id if permissible,
        -- or use the user_id itself (system notification) if logic allows.
        
        -- Strategy: If p_admin_id is provided, use it. If not, use p_user_id as "self" or system actor.
        -- Better yet, let's assume system notifications might not need actor_id or it can be null.
        -- However, migration_notifications.sql shows: actor_id UUID REFERENCES public.profiles(id)
        -- It doesn't say NOT NULL, so it should be nullable.
        
        INSERT INTO public.notifications (user_id, actor_id, type, data)
        VALUES (
            p_user_id, 
            p_admin_id, -- Can be NULL if not provided
            'system', 
            json_build_object(
                'title', 'Application Approved!',
                'message', 'Congratulations! Your request to become a ' || v_type || ' has been approved.'
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
