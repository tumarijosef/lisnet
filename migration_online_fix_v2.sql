-- 1. Ensure the column exists with correct type
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Create a robust heartbeat function that bypasses RLS if needed (using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_heartbeat(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = timezone('utc'::text, now())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure RLS is configured to allow updates to last_seen for the user themselves
-- First, check if RLS is enabled. If so, add the policy.
DO $$
BEGIN
    -- Only add policies if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'profiles' AND c.relrowsecurity = true
    ) THEN
        DROP POLICY IF EXISTS "Allow users to update their own presence" ON public.profiles;
        CREATE POLICY "Allow users to update their own presence" ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_heartbeat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_heartbeat(UUID) TO anon;

-- 5. Set all current last_seen to now so we don't have "1 day ago" for active users
UPDATE public.profiles SET last_seen = timezone('utc'::text, now()) WHERE last_seen IS NULL;
