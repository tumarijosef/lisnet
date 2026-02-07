-- Allow any authenticated artist to insert new releases
DROP POLICY IF EXISTS "Artists can insert own releases" ON public.releases;
CREATE POLICY "Artists can insert own releases" ON public.releases
    FOR INSERT WITH CHECK (
        auth.uid() = artist_id 
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('artist', 'admin'))
    );

-- Allow artists to update their own releases
DROP POLICY IF EXISTS "Artists can update own releases" ON public.releases;
CREATE POLICY "Artists can update own releases" ON public.releases
    FOR UPDATE USING (
        auth.uid() = artist_id
    );

-- Allow any authenticated user (artist) to insert tracks linked to their release
-- Note: It's harder to check 'release.artist_id' in a simple USING clause for INSERT, 
-- but we can check if the user has access to the release via a subquery potentially, 
-- or rely on the fact that they can only create tracks for release_ids they know.
-- A stricter check would be a trigger or a function, but for now let's allow insert if auth.uid() matches.
-- Actually, the best way for tracks is to check if the release belongs to the user.
DROP POLICY IF EXISTS "Artists can insert tracks for own releases" ON public.tracks;
CREATE POLICY "Artists can insert tracks for own releases" ON public.tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.releases 
            WHERE id = release_id AND artist_id = auth.uid()
        )
    );

-- Allow artists to update their own tracks
DROP POLICY IF EXISTS "Artists can update own tracks" ON public.tracks;
CREATE POLICY "Artists can update own tracks" ON public.tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.releases 
            WHERE id = release_id AND artist_id = auth.uid()
        )
    );
        
-- Allow artists to delete their own tracks
DROP POLICY IF EXISTS "Artists can delete own tracks" ON public.tracks;
CREATE POLICY "Artists can delete own tracks" ON public.tracks
    FOR DELETE USING (
         EXISTS (
            SELECT 1 FROM public.releases 
            WHERE id = release_id AND artist_id = auth.uid()
        )
    );

-- Allow artists to manage track_artists (tagging) for their own tracks
DROP POLICY IF EXISTS "Artists can manage track tags" ON public.track_artists;
CREATE POLICY "Artists can manage track tags" ON public.track_artists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tracks t
            JOIN public.releases r ON t.release_id = r.id
            WHERE t.id = track_id AND r.artist_id = auth.uid()
        )
    );
