-- Create a specific function for heartbeat to bypass any RLS complexities
CREATE OR REPLACE FUNCTION public.handle_heartbeat(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = timezone('utc'::text, now())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policy for profiles allows users to update their own last_seen if RLS is enabled
-- (Though the user said RLS was disabled, this is safer)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'profiles' AND c.relrowsecurity = true
    ) THEN
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
    END IF;
END $$;
