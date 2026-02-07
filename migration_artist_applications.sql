-- Create the artist_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.artist_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('artist', 'label')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON public.artist_applications;
CREATE POLICY "Users can view own applications" ON public.artist_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create applications
DROP POLICY IF EXISTS "Users can create applications" ON public.artist_applications;
CREATE POLICY "Users can create applications" ON public.artist_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON public.artist_applications;
CREATE POLICY "Admins can view all applications" ON public.artist_applications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow admins to update applications
DROP POLICY IF EXISTS "Admins can update applications" ON public.artist_applications;
CREATE POLICY "Admins can update applications" ON public.artist_applications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
