-- 1. Disable triggers that might be interfering
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Force update the specific columns for ALL users to defaults if null
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;
UPDATE public.profiles SET artist_type = 'none' WHERE artist_type IS NULL;

-- 3. Temporarily DISABLE RLS completely to rule out policy issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Create a function to update user role that bypasses RLS
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID, 
    new_role TEXT, 
    new_artist_type TEXT,
    new_status TEXT,
    new_username TEXT,
    new_full_name TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        role = new_role::text,
        artist_type = new_artist_type::text,
        status = new_status::text,
        username = new_username::text,
        full_name = new_full_name::text,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/admin),
-- bypassing the RLS of the user calling it.
