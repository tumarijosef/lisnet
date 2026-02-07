-- Clean up existing policies first to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Artists can insert own releases" ON public.releases;
DROP POLICY IF EXISTS "Artists can update own releases" ON public.releases;
DROP POLICY IF EXISTS "Artists can insert tracks" ON public.tracks;
DROP POLICY IF EXISTS "Artists can manage tags" ON public.track_artists;
DROP POLICY IF EXISTS "Users view own" ON public.artist_applications;
DROP POLICY IF EXISTS "Users create own" ON public.artist_applications;
DROP POLICY IF EXISTS "Admins manage all" ON public.artist_applications;

-- 1. Ensure Columns Exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS artist_type text DEFAULT 'none';

-- 2. Profiles Management Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Admins can update any profile" ON public.profiles 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 3. Release Management Policies
CREATE POLICY "Artists can insert own releases" ON public.releases
FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own releases" ON public.releases
FOR UPDATE USING (auth.uid() = artist_id);

CREATE POLICY "Artists can insert tracks" ON public.tracks
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.releases WHERE id = release_id AND artist_id = auth.uid())
);

CREATE POLICY "Artists can manage tags" ON public.track_artists
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tracks t
        JOIN public.releases r ON t.release_id = r.id
        WHERE t.id = track_id AND r.artist_id = auth.uid()
    )
);

-- 4. Applications Table & Policies
CREATE TABLE IF NOT EXISTS public.artist_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('artist', 'label')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own" ON public.artist_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own" ON public.artist_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all" ON public.artist_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Super Admin Function
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
        role = new_role,
        artist_type = new_artist_type,
        status = new_status,
        username = new_username,
        full_name = new_full_name,
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
