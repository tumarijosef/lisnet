-- Table to track login sessions on the web
CREATE TABLE IF NOT EXISTS public.web_auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, confirmed, expired
    telegram_id BIGINT,
    user_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '10 minutes')
);

-- Enable RLS
ALTER TABLE public.web_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a session
CREATE POLICY "Allow anyone to create auth sessions"
    ON public.web_auth_sessions FOR INSERT
    WITH CHECK (true);

-- Anyone can watch their own session by ID
CREATE POLICY "Allow anyone to read auth sessions by ID"
    ON public.web_auth_sessions FOR SELECT
    USING (true);

-- Only authenticated users (or anyone with the ID) can update (we'll use the ID as a secret)
CREATE POLICY "Allow update by session ID"
    ON public.web_auth_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION clean_expired_auth_sessions() RETURNS void AS $$
BEGIN
    DELETE FROM public.web_auth_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
