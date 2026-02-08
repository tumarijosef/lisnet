
-- Function to safely delete a user profile as an admin
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. Security Check: Is the caller an admin?
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- 2. Cleanup dependent data
    -- Delete from user_library
    DELETE FROM public.user_library WHERE user_id = target_user_id;
    
    -- Delete from notifications
    DELETE FROM public.notifications WHERE user_id = target_user_id;
    
    -- Delete from artist_applications (if any)
    DELETE FROM public.artist_applications WHERE user_id = target_user_id;

    -- 3. Delete the profile
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- Note: This does NOT delete from auth.users (requires service role)
    -- But since we are moving away from Google Auth, this cleans up our UI.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
