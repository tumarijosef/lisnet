import { useNavigate, NavLink } from 'react-router-dom';
import { Search as SearchIcon, Home, Library, Users, User, LogOut, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { twMerge } from 'tailwind-merge';

const Topbar = () => {
    const navigate = useNavigate();
    const { profile, logout } = useAuthStore();
    const { language } = useLanguageStore();
    const t = translations[language].nav;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const navItems = [
        { label: t.feed, icon: Home, path: '/feed' },
        { label: t.search, icon: SearchIcon, path: '/search' },
        { label: t.community, icon: Users, path: '/community' },
        { label: t.store, icon: Library, path: '/store' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-8 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/feed')}>
                <div className="w-9 h-9 bg-[#1DB954] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
                    <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
                </div>
                <h1 className="text-xl font-black tracking-tighter uppercase hidden lg:block">Lisnet</h1>
            </div>

            {/* Navigation & Search Group */}
            <div className="flex-1 max-w-2xl mx-12 flex items-center gap-6">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <SearchIcon size={18} className="text-[#B3B3B3] group-focus-within:text-[#1DB954] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search artists, tracks, and more..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                    />
                </form>

                {/* Nav Links */}
                <nav className="hidden xl:flex items-center gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                twMerge(
                                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                                    isActive ? "text-[#1DB954] bg-[#1DB954]/10" : "text-[#B3B3B3] hover:text-white hover:bg-white/5"
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-4 shrink-0">
                <button
                    onClick={() => navigate('/community')}
                    className="p-2.5 rounded-full bg-white/5 text-[#B3B3B3] hover:text-white hover:scale-110 transition-all active:scale-95"
                >
                    <MessageCircle size={20} />
                </button>

                <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-1.5 pr-4 rounded-full cursor-pointer transition-all active:scale-95 border border-white/5"
                >
                    <div className={twMerge(
                        "w-8 h-8 rounded-full border-2 overflow-hidden",
                        profile?.role === 'admin' ? "border-[#FFD700]" :
                            profile?.role === 'artist' ? "border-[#1DB954]" : "border-white/10"
                    )}>
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-[11px] font-black text-white uppercase tracking-tighter truncate max-w-[100px]">
                            {profile?.full_name || profile?.username}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="p-2.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
