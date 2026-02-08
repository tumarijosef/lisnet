import { useNavigate, NavLink } from 'react-router-dom';
import { Search as SearchIcon, Home, Library, Users, User, LogOut, MessageCircle, Music, Disc, Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTracks } from '../hooks/useTracks';

const Topbar = () => {
    const navigate = useNavigate();
    const { profile, logout } = useAuthStore();
    const { language } = useLanguageStore();
    const { setCurrentTrack, setQueue } = usePlayerStore();
    const { tracks } = useTracks();
    const t = translations[language].nav;

    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Predictive Search Logic
    useEffect(() => {
        const fetchResults = async () => {
            const query = searchQuery.trim();
            if (query.length < 2) {
                setFilteredUsers([]);
                setFilteredTracks([]);
                return;
            }

            setIsSearching(true);
            try {
                // 1. Search Users
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, role')
                    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                    .limit(5);

                setFilteredUsers(users || []);

                // 2. Search Tracks (locally from hook for speed, or via query)
                const matchedTracks = tracks.filter(track =>
                    track.title.toLowerCase().includes(query.toLowerCase()) ||
                    track.artistName.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 5);

                setFilteredTracks(matchedTracks);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, tracks]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowResults(false);
        }
    };

    const handleItemClick = (type: 'user' | 'track', id: string, track?: any) => {
        if (type === 'user') {
            navigate(`/profile/${id}`);
        } else if (track) {
            setCurrentTrack(track);
            setQueue(tracks);
        }
        setShowResults(false);
        setSearchQuery('');
    };

    const navItems = [
        { label: t.feed, icon: Home, path: '/feed' },
        { label: t.search, icon: SearchIcon, path: '/search' },
        { label: t.community, icon: Users, path: '/community' },
        { label: t.store, icon: Library, path: '/store' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-8 flex items-center justify-between">
            {/* Search Group */}
            <div className="flex-1 max-w-2xl flex items-center gap-8" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <SearchIcon size={16} className="text-[#B3B3B3] group-focus-within:text-[#1DB954] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search artists, tracks..."
                        value={searchQuery}
                        onFocus={() => setShowResults(true)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                    />

                    {/* Results Dropdown */}
                    {showResults && (searchQuery.length >= 2) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[70vh] overflow-y-auto no-scrollbar py-2">
                                {/* Users Section */}
                                {filteredUsers.length > 0 && (
                                    <div className="px-2 mb-2">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-3 py-2">Profiles</p>
                                        {filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleItemClick('user', user.id)}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                                            >
                                                <div className={twMerge(
                                                    "w-8 h-8 rounded-full border shrink-0 overflow-hidden",
                                                    user.role === 'admin' ? "border-[#FFD700]" :
                                                        user.role === 'artist' ? "border-[#1DB954]" : "border-white/10"
                                                )}>
                                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{user.full_name || user.username}</p>
                                                    <p className="text-[9px] text-[#B3B3B3] font-black uppercase tracking-tighter">@{user.username}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tracks Section */}
                                {filteredTracks.length > 0 && (
                                    <div className="px-2">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-3 py-2">Tracks</p>
                                        {filteredTracks.map(track => (
                                            <div
                                                key={track.id}
                                                onClick={() => handleItemClick('track', track.id, track)}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-md shrink-0 overflow-hidden relative">
                                                    <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Play size={14} fill="white" className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{track.title}</p>
                                                    <p className="text-[9px] text-[#B3B3B3] font-black uppercase tracking-tighter">{track.artistName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {filteredUsers.length === 0 && filteredTracks.length === 0 && !isSearching && (
                                    <div className="py-8 text-center">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No results found</p>
                                    </div>
                                )}

                                {isSearching && (
                                    <div className="py-8 text-center">
                                        <div className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                )}
                            </div>

                            <div
                                onClick={handleSearchSubmit}
                                className="bg-white/5 p-3 text-center border-t border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                            >
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">See all results for "{searchQuery}"</p>
                            </div>
                        </div>
                    )}
                </form>

                {/* Nav Links */}
                <nav className="hidden xl:flex items-center gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                twMerge(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    isActive ? "text-[#1DB954] bg-[#1DB954]/10" : "text-[#B3B3B3] hover:text-white hover:bg-white/5"
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-5 shrink-0">
                <button
                    onClick={() => navigate('/community')}
                    className="p-2 rounded-full bg-white/5 text-[#B3B3B3] hover:text-white hover:scale-110 transition-all active:scale-95"
                >
                    <MessageCircle size={18} />
                </button>

                <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-1 pr-3 rounded-full cursor-pointer transition-all active:scale-95 border border-white/5"
                >
                    <div className={twMerge(
                        "w-7 h-7 rounded-full border-2 overflow-hidden",
                        profile?.role === 'admin' ? "border-[#FFD700]" :
                            profile?.role === 'artist' ? "border-[#1DB954]" : "border-white/10"
                    )}>
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                    <p className="hidden md:block text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[100px]">
                        {profile?.full_name || profile?.username}
                    </p>
                </div>

                <button
                    onClick={logout}
                    className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
