-- Add last_seen column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update the status displayed in the UI based on this value
-- If within 5 minutes, user is considered "Online"
