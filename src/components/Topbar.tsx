import { useNavigate, NavLink } from 'react-router-dom';
import { Search as SearchIcon, Home, Library, Users, User, LogOut, MessageCircle, Music, Disc, Play, Bell, Settings, RefreshCcw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTracks } from '../hooks/useTracks';
import { useLibraryStore } from '../store/useLibraryStore';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';

const Topbar = () => {
    const navigate = useNavigate();
    const { profile, logout } = useAuthStore();
    const { language } = useLanguageStore();
    const { setCurrentTrack, setQueue } = usePlayerStore();
    const { fetchLibrary } = useLibraryStore();
    const { tracks } = useTracks();
    const t = translations[language];

    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch notifications count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!profile) return;
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        };
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [profile]);

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
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, role')
                    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                    .limit(5);

                setFilteredUsers(users || []);

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

    const handleRefresh = async () => {
        if (profile?.id) {
            await fetchLibrary(profile.id);
        }
        window.location.reload();
    };

    const navItems = [
        { label: t.nav.feed, icon: Home, path: '/feed' },
        { label: t.nav.search, icon: SearchIcon, path: '/search' },
        { label: t.nav.community, icon: Users, path: '/community' },
        { label: t.nav.store, icon: Library, path: '/store' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

            {/* Left Section: Search & App Info */}
            <div className="flex-1 flex items-center gap-6">
                {/* Search Bar (Moved Left) */}
                <div className="relative w-full max-w-[240px] hidden lg:block" ref={searchRef}>
                    <form onSubmit={handleSearchSubmit} className="relative group">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                            <SearchIcon size={14} className="text-[#B3B3B3] group-focus-within:text-[#1DB954] transition-colors" />
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
                            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-[#1DB954]/30 focus:bg-white/10 transition-all placeholder:text-white/20"
                        />
                    </form>

                    {/* Results Dropdown */}
                    {showResults && (searchQuery.length >= 2) && (
                        <div className="absolute top-full left-0 w-[320px] mt-2 bg-[#121212]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                                {filteredUsers.map(user => (
                                    <div key={user.id} onClick={() => handleItemClick('user', user.id)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer px-4">
                                        <div className={twMerge("w-7 h-7 rounded-full border shrink-0 overflow-hidden", user.role === 'admin' ? "border-[#FFD700]" : user.role === 'artist' ? "border-[#1DB954]" : "border-white/10")}>
                                            <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="min-w-0"><p className="text-[11px] font-bold text-white truncate">{user.full_name || user.username}</p><p className="text-[8px] text-[#B3B3B3] font-black uppercase tracking-tighter">@{user.username}</p></div>
                                    </div>
                                ))}
                                {filteredTracks.map(track => (
                                    <div key={track.id} onClick={() => handleItemClick('track', track.id, track)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer px-4 group">
                                        <div className="w-7 h-7 rounded-md shrink-0 overflow-hidden relative"><img src={track.coverUrl} className="w-full h-full object-cover" alt="" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={12} fill="white" className="text-white" /></div></div>
                                        <div className="min-w-0"><p className="text-[11px] font-bold text-white truncate">{track.title}</p><p className="text-[8px] text-[#B3B3B3] font-black uppercase tracking-tighter">{track.artistName}</p></div>
                                    </div>
                                ))}
                            </div>
                            <div onClick={handleSearchSubmit} className="bg-white/5 p-2.5 text-center border-t border-white/5 hover:bg-white/10 cursor-pointer"><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Global search for "{searchQuery}"</p></div>
                        </div>
                    )}
                </div>

                {/* Screenshot Integrated: App Info Area */}
                <div className="hidden xxl:flex items-center gap-3 border-l border-white/5 pl-6">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1DB954] to-[#191414] p-0.5 border border-white/10">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                        ) : (
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-[10px] font-black">{profile?.username?.substring(0, 2).toUpperCase()}</div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight leading-none">LISNET</span>
                        <span className="text-[8px] text-[#1DB954] font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#1DB954] animate-pulse"></span>
                            ONLINE
                        </span>
                    </div>
                </div>
            </div>

            {/* Center Navigation Buttons (Stay Centered) */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            twMerge(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                                isActive ? "text-[#1DB954] bg-[#1DB954]/10" : "text-[#B3B3B3] hover:text-white"
                            )
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Right Section: Actions from Screenshot & Profile */}
            <div className="flex-1 flex items-center justify-end gap-3 md:gap-5">
                {/* Screenshot Icons: Bell, Settings, Refresh */}
                <div className="flex items-center gap-3 border-r border-white/5 pr-5">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2 rounded-full text-[#B3B3B3] hover:text-white transition-all active:scale-95"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1DB954] rounded-full border-2 border-black"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-full text-[#B3B3B3] hover:text-white transition-all active:scale-95"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="text-[8px] font-black text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                    >
                        REFRESH
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-1 pr-3 rounded-full cursor-pointer transition-all active:scale-95 border border-white/5"
                    >
                        <div className={twMerge(
                            "w-7 h-7 rounded-full border-2 overflow-hidden",
                            profile?.role === 'admin' ? "border-[#FFD700]" :
                                profile?.role === 'artist' ? "border-[#1DB954]" : "border-white/10"
                        )}>
                            <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <p className="hidden xxl:block text-[9px] font-black text-white uppercase tracking-tighter truncate max-w-[80px]">
                            {profile?.username}
                        </p>
                    </div>

                    <button onClick={logout} className="p-2 rounded-full text-white/20 hover:text-red-500 transition-all">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
