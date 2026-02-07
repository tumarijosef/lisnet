import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Playlist {
    id: string;
    title: string;
    cover_url?: string;
    description?: string;
    tracks_count?: number;
    is_public?: boolean;
}

interface LibraryState {
    likedTrackIds: string[];
    collectionTrackIds: string[];
    playlists: Playlist[];
    loading: boolean;

    fetchLibrary: (userId: string) => Promise<void>;
    toggleLike: (userId: string, trackId: string) => Promise<void>;
    addToCollection: (userId: string, trackId: string) => Promise<void>;

    // Playlist Actions
    fetchPlaylists: (userId: string) => Promise<void>;
    createPlaylist: (userId: string, title: string) => Promise<string | null>;
    addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
    updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
    deletePlaylist: (playlistId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
    likedTrackIds: [],
    collectionTrackIds: [],
    playlists: [],
    loading: false,

    fetchLibrary: async (userId) => {
        try {
            set({ loading: true });

            const [likesRes, collectionRes] = await Promise.all([
                supabase.from('likes').select('track_id').eq('user_id', userId),
                supabase.from('user_collection').select('track_id').eq('user_id', userId)
            ]);

            if (likesRes.error) throw likesRes.error;
            if (collectionRes.error) throw collectionRes.error;

            set({
                likedTrackIds: likesRes.data.map(l => l.track_id),
                collectionTrackIds: collectionRes.data.map(c => c.track_id),
                loading: false
            });

            // Also fetch playlists
            await get().fetchPlaylists(userId);
        } catch (error) {
            console.error('Error fetching library:', error);
            set({ loading: false });
        }
    },

    fetchPlaylists: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .select(`
                    *,
                    playlist_tracks(count)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedPlaylists = data.map(p => ({
                ...p,
                tracks_count: p.playlist_tracks?.[0]?.count || 0
            }));

            set({ playlists: formattedPlaylists });
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    },

    createPlaylist: async (userId, title) => {
        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert([{ user_id: userId, title }])
                .select()
                .single();

            if (error) throw error;

            set({ playlists: [data, ...get().playlists] });
            return data.id;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    },

    addTrackToPlaylist: async (playlistId, trackId) => {
        try {
            const { error } = await supabase
                .from('playlist_tracks')
                .insert([{ playlist_id: playlistId, track_id: trackId }]);

            if (error) throw error;

            // Update local count
            set({
                playlists: get().playlists.map(p =>
                    p.id === playlistId ? { ...p, tracks_count: (p.tracks_count || 0) + 1 } : p
                )
            });
        } catch (error) {
            console.error('Error adding track to playlist:', error);
        }
    },

    removeTrackFromPlaylist: async (playlistId, trackId) => {
        try {
            const { error } = await supabase
                .from('playlist_tracks')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('track_id', trackId);

            if (error) throw error;

            set({
                playlists: get().playlists.map(p =>
                    p.id === playlistId ? { ...p, tracks_count: Math.max(0, (p.tracks_count || 0) - 1) } : p
                )
            });
        } catch (error) {
            console.error('Error removing track from playlist:', error);
        }
    },

    updatePlaylist: async (playlistId, updates) => {
        try {
            const { error } = await supabase
                .from('playlists')
                .update(updates)
                .eq('id', playlistId);

            if (error) throw error;

            set({
                playlists: get().playlists.map(p => p.id === playlistId ? { ...p, ...updates } : p)
            });
        } catch (error) {
            console.error('Error updating playlist:', error);
        }
    },

    deletePlaylist: async (playlistId) => {
        try {
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', playlistId);

            if (error) throw error;

            set({
                playlists: get().playlists.filter(p => p.id !== playlistId)
            });
        } catch (error) {
            console.error('Error deleting playlist:', error);
        }
    },

    toggleLike: async (userId, trackId) => {
        const isLiked = get().likedTrackIds.includes(trackId);

        try {
            if (isLiked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('track_id', trackId);

                if (error) throw error;
                set({ likedTrackIds: get().likedTrackIds.filter(id => id !== trackId) });
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert([{ user_id: userId, track_id: trackId }]);

                if (error) throw error;
                set({ likedTrackIds: [...get().likedTrackIds, trackId] });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    },

    addToCollection: async (userId, trackId) => {
        if (get().collectionTrackIds.includes(trackId)) return;

        try {
            const { error } = await supabase
                .from('user_collection')
                .insert([{ user_id: userId, track_id: trackId }]);

            if (error) throw error;
            set({ collectionTrackIds: [...get().collectionTrackIds, trackId] });
        } catch (error) {
            console.error('Error adding to collection:', error);
        }
    }
}));
