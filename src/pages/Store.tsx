import { useState } from 'react';
import { Play, Heart, ShoppingBag, User, Plus, Search, ArrowUpDown, LayoutGrid, List, Heart as HeartSolid, Folder, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { translations } from '../lib/translations';
import { useLibraryStore } from '../store/useLibraryStore';
import { useTracks } from '../hooks/useTracks';
import { useNavigate } from 'react-router-dom';

const Store = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'wishlist' | 'collection'>('wishlist');
    const { tracks } = useTracks();
    const { likedTrackIds, collectionTrackIds, playlists } = useLibraryStore();
    const { setCurrentTrack, setQueue } = usePlayerStore();
    const { language } = useLanguageStore();
    const { profile } = useAuthStore();
    const t = translations[language].store;

    const [sortBy, setSortBy] = useState<'recent' | 'az'>('recent');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const likedTracks = tracks.filter(t => likedTrackIds.includes(t.id));
    const collectionTracks = tracks.filter(t => collectionTrackIds.includes(t.id));

    // Sorting Logic
    const sortedPlaylists = [...playlists].sort((a, b) => {
        if (sortBy === 'az') return a.title.localeCompare(b.title);
        return 0; // Default to recent (as fetched from Supabase)
    });

    const filters = [t.playlists, t.albums, t.artists];

    return (
        <div className="flex flex-col min-h-screen bg-[#121212] p-4 pt-6 gap-6 pb-32">
            {/* Header with Search and Plus */}
            <header className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center shadow-lg border border-white/10">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Me" />
                        ) : (
                            <User size={20} className="text-white" />
                        )}
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase">{t.explore}</h1>
                </div>
                <div className="flex items-center gap-4 text-[#B3B3B3]">
                    <Search size={24} className="hover:text-white cursor-pointer" />
                    <Plus size={28} className="hover:text-white cursor-pointer" />
                </div>
            </header>

            {/* TAB SWITCHER (TOP) */}
            <div className="flex p-1 bg-[#181818]/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
                <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'wishlist'
                        ? 'bg-[#1DB954] text-black shadow-lg scale-[1.02]'
                        : 'text-[#B3B3B3] hover:text-white'
                        }`}
                >
                    {t.wishlist}
                </button>
                <button
                    onClick={() => setActiveTab('collection')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'collection'
                        ? 'bg-[#1DB954] text-black shadow-lg scale-[1.02]'
                        : 'text-[#B3B3B3] hover:text-white'
                        }`}
                >
                    {t.collection}
                </button>
            </div>



            {/* Sort & View Mode */}
            <div className="flex justify-between items-center px-1">
                <button
                    onClick={() => setSortBy(sortBy === 'recent' ? 'az' : 'recent')}
                    className="flex items-center gap-2 text-[#B3B3B3] hover:text-white group transition-colors"
                >
                    <ArrowUpDown size={16} className={`group-hover:scale-110 transition-transform ${sortBy === 'az' ? 'text-[#1DB954]' : ''}`} />
                    <span className="text-xs font-bold uppercase tracking-tight">
                        {sortBy === 'recent' ? t.sorting_recent : 'A-Z'}
                    </span>
                </button>
                <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="text-[#B3B3B3] hover:text-white p-2 transition-colors"
                >
                    {viewMode === 'list' ? <LayoutGrid size={20} /> : <List size={22} />}
                </button>
            </div>

            {/* Library Content */}
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-1'}`}>
                {activeTab === 'wishlist' && (
                    <>
                        {/* 1. LIKED TRACKS ROW */}
                        <div
                            onClick={() => navigate('/liked-tracks')}
                            className={`flex ${viewMode === 'grid' ? 'flex-col items-start gap-2 bg-[#181818]/40 p-4 rounded-3xl' : 'items-center gap-4 p-3'} rounded-xl hover:bg-white/5 transition-all cursor-pointer group active:scale-[0.98] border border-white/5`}
                        >
                            <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-16 h-16'} bg-gradient-to-br from-[#450af5] to-[#c4efd9] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-[1.02] transition-transform shrink-0`}>
                                <HeartSolid size={viewMode === 'grid' ? 40 : 28} fill="white" className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0 w-full text-left">
                                <h3 className={`font-black text-white leading-tight uppercase tracking-tight truncate ${viewMode === 'grid' ? 'text-sm mt-1' : ''}`}>{t.liked_tracks}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-3.5 h-3.5 bg-[#1DB954] rounded-full flex items-center justify-center shrink-0">
                                        <Plus size={8} className="text-black stroke-[4]" />
                                    </div>
                                    <p className="text-[10px] text-[#B3B3B3] font-bold uppercase tracking-widest leading-none truncate">
                                        {likedTrackIds.length} {t.count_tracks}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. CUSTOM PLAYLISTS */}
                        {sortedPlaylists.map((playlist) => (
                            <div
                                key={playlist.id}
                                onClick={() => navigate(`/playlist/${playlist.id}`)}
                                className={`flex ${viewMode === 'grid' ? 'flex-col items-start gap-2 bg-[#181818]/40 p-4 rounded-3xl' : 'items-center gap-4 p-3'} rounded-xl hover:bg-white/5 transition-all cursor-pointer group active:scale-[0.98] border border-white/5`}
                            >
                                <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-16 h-16'} bg-[#282828] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-[1.02] transition-transform overflow-hidden text-[#B3B3B3] shrink-0`}>
                                    {playlist.cover_url ? (
                                        <img src={playlist.cover_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 opacity-40">
                                            <Folder size={viewMode === 'grid' ? 40 : 24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 w-full text-left">
                                    <h3 className={`font-bold text-white leading-tight truncate ${viewMode === 'grid' ? 'text-sm mt-1' : ''}`}>{playlist.title}</h3>
                                    <p className="text-[10px] text-[#B3B3B3] font-bold uppercase tracking-widest mt-1 truncate">
                                        {playlist.tracks_count || 0} {t.count_tracks}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* EMPTY STATE */}
                        {likedTracks.length === 0 && playlists.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-[#B3B3B3] bg-white/[0.02] rounded-3xl border border-dashed border-white/5 mt-4">
                                <ListMusic size={64} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-tighter text-lg">{t.empty_wishlist}</p>
                                <p className="text-xs mt-2 opacity-60 px-10 text-center leading-relaxed">{t.go_explore}</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'collection' && (
                    <div className={`${viewMode === 'grid' ? 'contents' : 'flex flex-col gap-4 mt-2'}`}>
                        {collectionTracks.map(track => (
                            <div
                                key={track.id}
                                className={`${viewMode === 'grid'
                                    ? 'bg-white/[0.03] p-4 rounded-3xl flex flex-col items-start gap-4'
                                    : 'bg-[#181818]/60 p-3 rounded-2xl flex items-center gap-4'
                                    } group border border-white/5 hover:bg-[#282828] transition-all cursor-pointer active:scale-[0.98]`}
                            >
                                <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-16 h-16'} flex-shrink-0 relative`}>
                                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-xl shadow-lg" />
                                </div>
                                <div className="flex-1 min-w-0 w-full">
                                    <h3 className="font-bold text-white truncate text-sm">{track.title}</h3>
                                    <p className="text-[10px] text-[#B3B3B3] truncate uppercase tracking-widest font-bold mt-1">{track.artistName}</p>
                                    <span className="text-[9px] bg-[#1DB954]/10 text-[#1DB954] px-2 py-0.5 rounded-full font-black mt-2 inline-block uppercase tracking-widest border border-[#1DB954]/20">{t.owned}</span>
                                </div>
                                {viewMode !== 'grid' && (
                                    <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-[#1DB954] hover:text-black transition-all">
                                        <Play size={20} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Store;
