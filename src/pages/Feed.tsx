import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Heart, MessageCircle, MoreHorizontal, Play, Bell, Settings, Music, Disc } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { useTracks } from '../hooks/useTracks';
import { supabase } from '../lib/supabase';
import SettingsModal from '../components/SettingsModal';
import { useLibraryStore } from '../store/useLibraryStore';
import NotificationsModal from '../components/NotificationsModal';

interface Release {
    id: string;
    title: string;
    artist_name: string;
    cover_url?: string;
}

const Feed = () => {
    const navigate = useNavigate();
    const { setCurrentTrack, setQueue } = usePlayerStore();
    const { profile } = useAuthStore();
    const { posts } = useAppStore();
    const { language } = useLanguageStore();
    const { fetchLibrary } = useLibraryStore();
    const t = translations[language].feed;
    const { tracks, loading: tracksLoading } = useTracks();

    const [releases, setReleases] = useState<Release[]>([]);
    const [loadingReleases, setLoadingReleases] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleRefresh = async () => {
        if (profile?.id) {
            await fetchLibrary(profile.id);
        }
        window.location.reload();
    };

    useEffect(() => {
        const fetchReleases = async () => {
            const { data } = await supabase
                .from('releases')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setReleases(data);
            setLoadingReleases(false);
        };

        const fetchUnreadCount = async () => {
            if (!profile) return;
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        };

        fetchReleases();
        fetchUnreadCount();
    }, [profile]);

    const handlePlayTrack = (trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (track) {
            setCurrentTrack(track);
            setQueue(tracks);
        }
    };

    const recentTracks = tracks.slice(0, 6);

    const getUserInitials = () => {
        if (!profile) return '??';
        return profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col gap-8 p-4 pt-6 pb-20">
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} />

            {/* Header - Mobile Only */}
            <header className="flex md:hidden justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1DB954] to-[#191414] flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-white/10 cursor-pointer shadow-lg active:scale-95 transition-transform"
                        onClick={() => navigate('/profile')}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Me" />
                        ) : (
                            <span className="font-black tracking-tighter">{getUserInitials()}</span>
                        )}
                    </div>
                    <div>
                        <span className="font-bold text-lg block leading-none tracking-tighter">LISNET</span>
                        <span className="text-[10px] text-green-500 font-mono flex items-center gap-1 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            {loadingReleases ? t.syncing : t.online}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-white">
                    <button
                        onClick={() => setIsNotificationsModalOpen(true)}
                        className="relative p-1 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <Bell size={22} className={unreadCount > 0 ? "text-white" : "text-[#B3B3B3]"} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#1DB954] rounded-full border-2 border-[#121212] shadow-[0_0_10px_#1DB954]"></span>
                        )}
                    </button>
                    <button
                        className="p-1 hover:bg-white/5 rounded-full transition-colors"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <Settings size={22} className="text-[#B3B3B3] hover:text-white" />
                    </button>
                    <button onClick={handleRefresh} className="text-[9px] font-black bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-colors uppercase tracking-widest">{t.refresh}</button>
                </div>
            </header>

            {/* SECTION 1: Favorites & Recently Played (Grid) */}
            <section>
                <div className="grid grid-cols-2 gap-2">
                    <div
                        onClick={() => navigate('/liked-tracks')}
                        className="bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-md flex items-center overflow-hidden cursor-pointer group pr-2 relative h-14 active:scale-[0.98] transition-all"
                    >
                        <div className="w-14 h-14 flex items-center justify-center bg-white/20">
                            <Heart size={24} fill="white" className="text-white" />
                        </div>
                        <span className="text-[11px] font-black ml-2 line-clamp-2 leading-tight flex-1 text-white z-10 uppercase tracking-tight">{t.favorites}</span>
                    </div>

                    {recentTracks.slice(0, 5).map((track) => (
                        <div
                            key={`recent-${track.id}`}
                            onClick={() => handlePlayTrack(track.id)}
                            className="bg-[#2A2A2A]/40 hover:bg-[#2A2A2A] transition-all rounded-md flex items-center overflow-hidden cursor-pointer group pr-2 active:scale-[0.98] h-14"
                        >
                            <div className="w-14 h-14 bg-[#282828] shrink-0 relative overflow-hidden">
                                {track.coverUrl ? (
                                    <img
                                        src={track.coverUrl}
                                        className="w-full h-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-500"
                                        alt={track.title}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                        <Music size={18} />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3] hidden bg-[#282828]">
                                    <Music size={18} />
                                </div>
                            </div>
                            <span className="text-[11px] font-bold ml-2 line-clamp-2 leading-tight flex-1 text-white">{track.title}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION 3: Latest Releases (Albums/EPs) */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-none bg-[#1DB954] animate-pulse"></div>
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t.latest_releases}</h2>
                    </div>
                </div>

                {loadingReleases && <div className="text-white/30 text-xs font-mono animate-pulse">LOADING DATA...</div>}

                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                    {releases.map((release) => (
                        <div
                            key={`release-${release.id}`}
                            className="flex-shrink-0 w-40 bg-[#181818]/60 p-3 rounded-none hover:bg-[#282828] transition-all cursor-pointer group border border-white/5 active:scale-[0.95]"
                            onClick={() => navigate(`/release/${release.id}`)}
                        >
                            <div className="relative mb-3 overflow-hidden rounded-none bg-[#282828] aspect-square">
                                {release.cover_url ? (
                                    <img
                                        src={release.cover_url}
                                        alt={release.title}
                                        className="w-full h-full object-cover shadow-md group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                        <Disc size={40} />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3] hidden bg-[#282828]">
                                    <Disc size={40} />
                                </div>
                                <div className="absolute top-2 left-2 bg-[#1DB954] text-[8px] font-black px-1.5 py-0.5 rounded-none text-black shadow-lg uppercase tracking-tighter">
                                    NEW
                                </div>
                            </div>
                            <p className="font-bold text-white text-sm truncate leading-tight mb-1">{release.title}</p>
                            <p className="text-[#B3B3B3] text-[10px] truncate uppercase tracking-widest font-medium">{release.artist_name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECTION 4: Social Feed (TEMPORARILY DISABLED) */}
            {/* 
            <section>
                <h2 className="text-xl font-black mb-6 text-white tracking-tighter uppercase">{t.community}</h2>
                <div className="flex flex-col gap-6">
                    {posts.map((post) => (
                        <article key={post.id} className="bg-[#181818]/40 rounded-none overflow-hidden border border-white/5 shadow-xl">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={post.artistAvatar} alt={post.artistName} className="w-10 h-10 rounded-full object-cover border-2 border-[#1DB954]/20 p-0.5" />
                                    <div>
                                        <h3 className="font-bold text-white text-sm leading-none mb-1.5">{post.artistName}</h3>
                                        <span className="text-[9px] text-[#1DB954] uppercase font-black tracking-widest">{t.artist_update}</span>
                                    </div>
                                </div>
                                <button className="text-[#B3B3B3] p-1">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <div className="px-4 pb-4">
                                <p className="text-sm text-[#E0E0E0] leading-relaxed mb-4">{post.content}</p>

                                {post.imageUrl && (
                                    <div className="rounded-xl overflow-hidden border border-white/5 mb-4 shadow-inner">
                                        <img src={post.imageUrl} alt="Post visual" className="w-full h-56 object-cover" />
                                    </div>
                                )}

                                {post.trackId && (
                                    <div
                                        onClick={() => handlePlayTrack(post.trackId!)}
                                        className="bg-[#282828]/60 backdrop-blur-md rounded-xl p-3 flex items-center gap-4 active:bg-[#333333] transition-all cursor-pointer group border border-white/5"
                                    >
                                        <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.3)] group-hover:scale-105 transition-transform">
                                            <Play size={24} fill="currentColor" className="ml-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-xs text-white uppercase tracking-widest truncate">{t.listen_preview}</h4>
                                            <p className="text-[10px] text-[#1DB954] font-mono mt-1">{t.tap_to_play}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-3 flex items-center gap-6 border-t border-white/5 bg-white/[0.02]">
                                <button className="flex items-center gap-2 text-[#B3B3B3] hover:text-[#1DB954] transition-colors group">
                                    <Heart size={18} className="group-active:scale-125 transition-transform" />
                                    <span className="text-xs font-black">{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors">
                                    <MessageCircle size={18} />
                                    <span className="text-xs font-black">{post.comments}</span>
                                </button>
                                <button className="ml-auto text-[#B3B3B3] hover:text-white transition-colors">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            */}
        </div>
    );
};

export default Feed;
