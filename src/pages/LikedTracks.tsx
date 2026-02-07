import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Play, User, ListMusic, Music } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useTracks } from '../hooks/useTracks';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';

const LikedTracks = () => {
    const navigate = useNavigate();
    const { tracks } = useTracks();
    const { likedTrackIds } = useLibraryStore();
    const { setCurrentTrack, setQueue, isPlaying } = usePlayerStore();
    const { language } = useLanguageStore();
    const t = translations[language].store;

    const likedTracks = tracks.filter(t => likedTrackIds.includes(t.id));

    const handlePlay = (startIndex: number) => {
        setQueue(likedTracks);
        setCurrentTrack(likedTracks[startIndex]);
    };

    return (
        <div className="min-h-screen bg-[#121212] pb-32">
            {/* Header with Background Gradient */}
            <div className="h-64 bg-gradient-to-b from-[#450af5] to-[#121212] p-6 flex flex-col justify-end gap-4 relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex items-center gap-6">
                    <div className="w-40 h-40 bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-lg flex items-center justify-center shadow-2xl shrink-0">
                        <Heart size={80} fill="white" className="text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t.playlist_label}</span>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white uppercase">{t.liked_tracks}</h1>
                        <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                            <span className="text-[#1DB954]">LISNET</span>
                            <span className="opacity-50">•</span>
                            <span>{likedTracks.length} {t.count_tracks}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 flex items-center gap-6">
                <button
                    onClick={() => handlePlay(0)}
                    disabled={likedTracks.length === 0}
                    className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                >
                    <Play size={28} fill="black" className="ml-1" />
                </button>
            </div>

            {/* List */}
            <div className="px-4 flex flex-col gap-1">
                {likedTracks.map((track, index) => (
                    <div
                        key={track.id}
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

                        <Heart size={16} fill="#1DB954" className="text-[#1DB954]" />
                    </div>
                ))}

                {likedTracks.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-[#B3B3B3] opacity-20">
                        <ListMusic size={64} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">No liked tracks yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LikedTracks;
