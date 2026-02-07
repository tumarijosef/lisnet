import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Play, Pause, ChevronLeft, Clock, Disc, Share2, Heart, X, User } from "lucide-react";
import { supabase } from '../lib/supabase';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { translations } from '../lib/translations';
import { Track } from '../types';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { Plus } from 'lucide-react';

interface ReleaseData {
    id: string;
    title: string;
    artist_name: string;
    artist_id?: string;
    cover_url?: string;
    description?: string;
    price: number;
    genre: string;
    created_at: string;
    tracks: {
        id: string;
        title: string;
        artist_name?: string;
        duration: number;
        audio_url: string;
        position: number;
        realDuration?: number;
    }[];
}

const ReleaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [release, setRelease] = useState<ReleaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [playlistModalTrackId, setPlaylistModalTrackId] = useState<string | null>(null);

    const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying, setQueue } = usePlayerStore();
    const { language } = useLanguageStore();
    const { profile } = useAuthStore();
    const { likedTrackIds, collectionTrackIds, toggleLike, addToCollection } = useLibraryStore();
    const t = translations[language].release;

    const isLiked = release?.tracks.some(t => likedTrackIds.includes(t.id));
    const isPurchased = release?.tracks.some(t => collectionTrackIds.includes(t.id));

    const handleToggleLike = () => {
        if (!release || !profile) return;
        // For simplicity, we toggle like for the first track or all tracks. 
        // Usually, likes on releases map to a core track or the release itself.
        // Let's toggle the first track in the release for now.
        if (release.tracks.length > 0) {
            toggleLike(profile.id, release.tracks[0].id);
        }
    };

    const handleBuy = () => {
        if (!release || !profile) return;
        // Navigation to checkout placeholder
        navigate('/checkout', { state: { releaseId: release.id, price: release.price, title: release.title } });
    };

    useEffect(() => {
        const fetchRelease = async () => {
            if (!id) return;
            try {
                const { data, error } = await supabase
                    .from('releases')
                    .select(`
                        *,
                        tracks (*)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data.tracks) {
                    data.tracks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                }

                setRelease(data);

                if (data && data.tracks) {
                    data.tracks.forEach((track: any) => {
                        const audio = new Audio(track.audio_url);
                        audio.onloadedmetadata = () => {
                            setRelease(prev => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    tracks: prev.tracks.map(t =>
                                        t.id === track.id ? { ...t, realDuration: audio.duration } : t
                                    )
                                };
                            });
                        };
                    });
                }

            } catch (error) {
                console.error("Error fetching release:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelease();
    }, [id]);

    const handlePlay = (trackIndex: number = 0) => {
        if (!release || !release.tracks.length) return;

        const playerQueue: Track[] = release.tracks.map(t => ({
            id: t.id,
            title: t.title,
            artistId: release.artist_id || 'unknown',
            artistName: t.artist_name || release.artist_name,
            coverUrl: release.cover_url || '',
            audioUrl: t.audio_url,
            duration: t.realDuration || t.duration || 0,
            price: release.price,
            releaseId: release.id
        }));

        setQueue(playerQueue);
        setCurrentTrack(playerQueue[trackIndex]);
        setIsPlaying(true);
    };

    const isCurrentTrack = (trackId: string) => currentTrack?.id === trackId;

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="flex items-center justify-center h-screen text-white bg-[#121212]">...</div>;
    if (!release) return <div className="flex items-center justify-center h-screen text-white bg-[#121212] font-black">NOT FOUND</div>;

    return (
        <div className="pb-32 bg-gradient-to-b from-[#1e1e1e] to-[#121212] min-h-screen text-white relative">
            <AddToPlaylistModal
                isOpen={!!playlistModalTrackId}
                onClose={() => setPlaylistModalTrackId(null)}
                trackId={playlistModalTrackId || ''}
            />

            {/* Cover Art Modal */}
            {isCoverModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setIsCoverModalOpen(false)}
                >
                    <div className="relative max-w-4xl max-h-screen">
                        <Button
                            variant="ghost"
                            className="absolute -top-12 right-0 text-white hover:bg-white/10 font-bold uppercase tracking-tighter"
                            onClick={() => setIsCoverModalOpen(false)}
                        >
                            <X size={20} className="mr-2" /> {t.close}
                        </Button>
                        <img
                            src={release.cover_url}
                            alt={release.title}
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-md"
                        />
                    </div>
                </div>
            )}

            {/* Back Button */}
            <div className="pt-6 px-6">
                <Button
                    variant="ghost"
                    className="text-white/50 hover:text-white pl-0 hover:bg-transparent uppercase font-black text-xs tracking-widest flex items-center gap-1"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft size={18} /> {t.back}
                </Button>
            </div>

            {/* Header Content */}
            <div className="p-4 sm:p-6 pt-4 flex flex-col items-center md:items-start md:flex-row gap-6 md:gap-8">

                {/* Cover Art */}
                <div
                    className="w-48 h-48 sm:w-64 sm:h-64 md:w-52 md:h-52 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0 rounded-xl overflow-hidden bg-[#282828] cursor-zoom-in hover:opacity-90 transition-opacity mx-auto md:mx-0 border border-white/5"
                    onClick={() => setIsCoverModalOpen(true)}
                >
                    {release.cover_url ? (
                        <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Disc size={64} />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 w-full text-center md:text-left pt-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[#1DB954]">
                        {release.tracks.length > 1 ? t.album : t.single} • {release.genre}
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight drop-shadow-2xl">{release.title}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#1DB954] to-[#191414] border border-white/10" />
                        <span
                            className="font-bold text-white hover:underline cursor-pointer hover:text-[#1DB954] transition-colors"
                            onClick={async (e) => {
                                if (release.artist_id) {
                                    navigate(`/profile/${release.artist_id}`);
                                } else {
                                    // Fallback: try to find artist by name
                                    const { data } = await supabase
                                        .from('profiles')
                                        .select('id')
                                        .eq('full_name', release.artist_name)
                                        .maybeSingle();
                                    if (data) navigate(`/profile/${data.id}`);
                                }
                            }}
                        >
                            {release.artist_name}
                        </span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono">{new Date(release.created_at).getFullYear()}</span>
                        <span className="opacity-30">•</span>
                        <span className="font-bold">{release.tracks.length} {t.tracks_count}</span>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="px-4 sm:px-6 py-4 flex justify-between md:justify-start items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                    <Button
                        size="icon"
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-[0_8px_20px_rgba(29,185,84,0.4)] hover:scale-105 transition-transform"
                        onClick={() => handlePlay(0)}
                    >
                        {isPlaying && release.tracks.some(t => t.id === currentTrack?.id) ? (
                            <Pause fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8" />
                        ) : (
                            <Play fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={`transition-colors ${isLiked ? 'text-[#1DB954]' : 'text-white/50 hover:text-[#1DB954]'}`}
                        onClick={handleToggleLike}
                    >
                        <Heart className="w-6 h-6 sm:w-8 sm:h-8" fill={isLiked ? "currentColor" : "none"} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white transition-colors">
                        <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                </div>

                <div className="md:ml-4">
                    <Button
                        className={`rounded-full px-6 sm:px-8 h-10 sm:h-12 font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-xl border-none ${isPurchased ? 'bg-[#1DB954]/20 text-[#1DB954] cursor-default' : 'bg-white text-black hover:bg-[#1DB954] hover:text-black'}`}
                        onClick={handleBuy}
                        disabled={isPurchased}
                    >
                        {isPurchased ? t.owned : `${t.buy_for} $${release.price}`}
                    </Button>
                </div>
            </div>

            {/* Tracklist */}
            <div className="px-6 mt-8">
                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-3">
                    <div className="grid grid-cols-[32px_1fr_auto] gap-4 px-4">
                        <span className="text-center font-mono">#</span>
                        <span>НАЗВАНИЕ</span>
                        <div className="flex justify-end pr-2"><Clock size={14} /></div>
                        <div className="w-8"></div>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    {release.tracks.map((track, idx) => (
                        <div
                            key={track.id}
                            className={`group grid grid-cols-[32px_1fr_auto_auto] gap-4 px-4 py-3 rounded-lg hover:bg-white/5 items-center cursor-pointer transition-all ${isCurrentTrack(track.id) ? 'bg-[#1DB954]/10' : ''}`}
                            onClick={() => handlePlay(idx)}
                        >
                            <div className="w-8 text-center text-sm font-mono text-white/30 group-hover:hidden flex justify-center">
                                {isCurrentTrack(track.id) && isPlaying ? (
                                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="h-3 w-3" alt="playing" />
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            <div className="w-8 hidden group-hover:flex justify-center text-[#1DB954]">
                                <Play size={14} fill="currentColor" />
                            </div>

                            <div className="flex flex-col min-w-0">
                                <span className={`font-bold text-base truncate ${isCurrentTrack(track.id) ? 'text-[#1DB954]' : 'text-white'}`}>
                                    {track.title}
                                </span>
                                <div className="flex flex-col">
                                    {track.artist_name && track.artist_name !== release.artist_name && (
                                        <span className="text-[11px] text-[#B3B3B3] flex items-center gap-1 mt-0.5 font-medium uppercase tracking-tight">
                                            <User size={10} className="shrink-0" /> {track.artist_name}
                                        </span>
                                    )}
                                    {(!(track.artist_name && track.artist_name !== release.artist_name)) && (
                                        <span className="text-[11px] text-[#B3B3B3] md:hidden mt-0.5 font-medium uppercase tracking-tight">
                                            {release.artist_name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm font-mono text-white/30 tabular-nums text-right pr-2">
                                {track.realDuration ? formatTime(track.realDuration) : "..."}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setPlaylistModalTrackId(track.id); }}
                                className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                    <p className="font-black text-[10px] uppercase tracking-[0.3em] text-[#1DB954] mb-4">{t.description}</p>
                    <p className="whitespace-pre-wrap leading-relaxed text-[#B3B3B3] text-sm font-medium">
                        {release.description || t.no_description}
                    </p>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{t.release_date}: {new Date(release.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-black border border-white/5">WAV</div>
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[8px] font-black border border-white/5">MP3</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReleaseDetails;
