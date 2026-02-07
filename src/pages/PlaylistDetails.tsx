import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, ListMusic, Trash2, Music, Pencil, Globe, Lock } from 'lucide-react';
import EditPlaylistModal from '../components/EditPlaylistModal';
import { supabase } from '../lib/supabase';
import { useLibraryStore } from '../store/useLibraryStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { Track } from '../types';

const PlaylistDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<any>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { deletePlaylist } = useLibraryStore();
    const { setCurrentTrack, setQueue, isPlaying } = usePlayerStore();
    const { language } = useLanguageStore();
    const t = translations[language].store;

    useEffect(() => {
        const fetchPlaylistData = async () => {
            if (!id) return;
            try {
                // 1. Fetch Playlist Info
                const playlistRes = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (playlistRes.error) throw playlistRes.error;
                setPlaylist(playlistRes.data);

                // 2. Fetch Tracks via junction table
                const { data, error } = await supabase
                    .from('playlist_tracks')
                    .select(`
                        track_id,
                        tracks (
                            *,
                            releases (
                                cover_url
                            )
                        )
                    `)
                    .eq('playlist_id', id)
                    .order('added_at', { ascending: true });

                if (error) throw error;

                const formattedTracks = data.map((item: any) => {
                    const track = item.tracks;
                    const release = Array.isArray(track.releases) ? track.releases[0] : track.releases;

                    return {
                        id: track.id,
                        title: track.title,
                        artistId: track.artist_id || 'unknown',
                        artistName: track.artist_name || 'Unknown Artist',
                        coverUrl: release?.cover_url || '',
                        audioUrl: track.audio_url,
                        duration: track.duration || 0,
                        price: track.price || 0,
                        genre: track.genre
                    };
                });

                setTracks(formattedTracks);
            } catch (error) {
                console.error('Error fetching playlist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylistData();
    }, [id]);

    const handlePlay = (startIndex: number) => {
        if (tracks.length === 0) return;
        setQueue(tracks);
        setCurrentTrack(tracks[startIndex]);
    };

    const handleDelete = async () => {
        if (!id || !window.confirm('Delete this playlist?')) return;
        await deletePlaylist(id);
        navigate('/store');
    };

    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">...</div>;
    if (!playlist) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Playlist not found</div>;

    return (
        <div className="min-h-screen bg-[#121212] pb-32">
            <EditPlaylistModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                playlist={playlist}
            />
            {/* Header */}
            <div className="h-64 bg-gradient-to-b from-[#282828] to-[#121212] p-6 flex flex-col justify-end gap-4 relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white"
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    onClick={handleDelete}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors z-10"
                >
                    <Trash2 size={20} />
                </button>

                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute top-6 right-20 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
                >
                    <Pencil size={20} />
                </button>

                <div className="flex items-center gap-6">
                    <div
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-40 h-40 bg-[#282828] rounded-lg flex items-center justify-center shadow-2xl shrink-0 overflow-hidden border border-white/5 cursor-pointer relative group"
                    >
                        {playlist.cover_url ? (
                            <img src={playlist.cover_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <Music size={80} className="text-white/20" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil size={32} className="text-white" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.playlist_label}</span>
                            {playlist.is_public ? (
                                <span className="text-[8px] px-2 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] font-black uppercase tracking-widest border border-[#1DB954]/20 flex items-center gap-1">
                                    <Globe size={10} />
                                    Public
                                </span>
                            ) : (
                                <span className="text-[8px] px-2 py-0.5 rounded bg-white/5 text-[#B3B3B3] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
                                    <Lock size={10} />
                                    Private
                                </span>
                            )}
                        </div>
                        <h1
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-4xl sm:text-6xl font-black tracking-tighter text-white uppercase truncate cursor-pointer hover:underline decoration-[#1DB954] decoration-4 underline-offset-8"
                        >
                            {playlist.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                            <span className="text-[#1DB954]">LISNET</span>
                            <span className="opacity-50">•</span>
                            <span>{tracks.length} {t.count_tracks}</span>
                        </div>
                        {playlist.description && (
                            <p className="text-sm text-[#B3B3B3] font-medium line-clamp-2 mt-1">{playlist.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 flex items-center gap-6">
                <button
                    onClick={() => handlePlay(0)}
                    disabled={tracks.length === 0}
                    className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                >
                    <Play size={28} fill="black" className="ml-1" />
                </button>
            </div>

            {/* Tracklist */}
            <div className="px-4 flex flex-col gap-1">
                {tracks.map((track, index) => (
                    <div
                        key={`${track.id}-${index}`}
                        onClick={() => handlePlay(index)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                    >
                        <div className="w-6 text-center text-[#B3B3B3] font-mono text-sm group-hover:hidden">
                            {index + 1}
                        </div>
                        <div className="w-6 hidden group-hover:flex items-center justify-center text-[#1DB954]">
                            <Play size={14} fill="currentColor" />
                        </div>

                        <div className="w-12 h-12 bg-[#282828] rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                            {track.coverUrl ? (
                                <img
                                    src={track.coverUrl}
                                    className="w-full h-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                    <Music size={20} />
                                </div>
                            )}
                            {/* Fallback icon hidden by default, shown on error */}
                            <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3] hidden bg-[#282828]">
                                <Music size={20} />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{track.title}</p>
                            <p className="text-xs text-[#B3B3B3] font-bold uppercase tracking-tight truncate mt-0.5">{track.artistName}</p>
                        </div>
                    </div>
                ))}

                {tracks.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-[#B3B3B3] opacity-20">
                        <ListMusic size={64} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">Playlist is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistDetails;
