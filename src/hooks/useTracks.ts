
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define Interface (matching what we expect from DB + app logic)
export interface Track {
    id: string;
    title: string;
    artistName: string;
    artistId: string;
    coverUrl: string;
    audioUrl: string;
    duration: number;
    price: number;
    genre: string;
    plays: number;
    releaseId?: string;
    releaseTitle?: string;
}

export const useTracks = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                setLoading(true);

                // Fetch tracks joined with releases
                const { data, error } = await supabase
                    .from('tracks')
                    .select(`
                        id,
                        title,
                        artist_name,
                        audio_url,
                        duration,
                        position,
                        release_id,
                        releases!inner (
                            id,
                            title,
                            artist_name,
                            cover_url,
                            price,
                            genre
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const formattedTracks: Track[] = data.map((item: any) => {
                        // Supabase can sometimes return relations as arrays depending on inferred cardinality
                        const release = Array.isArray(item.releases) ? item.releases[0] : item.releases;

                        return {
                            id: item.id,
                            title: item.title,
                            artistName: item.artist_name || release?.artist_name || 'Unknown Artist',
                            artistId: 'unknown',
                            coverUrl: release?.cover_url || '',
                            audioUrl: item.audio_url,
                            duration: item.duration || 180,
                            price: parseFloat(release?.price) || 0.99,
                            genre: release?.genre || 'Electronic',
                            plays: 0,
                            releaseId: item.release_id,
                            releaseTitle: release?.title || ''
                        };
                    });
                    setTracks(formattedTracks);
                }
            } catch (err: any) {
                console.error('Error in useTracks:', err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTracks();
    }, []);

    return { tracks, loading, error };
};
