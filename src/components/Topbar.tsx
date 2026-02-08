import { useNavigate, NavLink } from 'react-router-dom';
import { Home, Library, Users, User, LogOut, MessageCircle, Bell, Settings, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { useLibraryStore } from '../store/useLibraryStore';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';

const Topbar = () => {
    const navigate = useNavigate();
    const { profile, logout } = useAuthStore();
    const { language } = useLanguageStore();
    const { fetchLibrary } = useLibraryStore();
    const t = translations[language];

    const [unreadCount, setUnreadCount] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [profile]);

    const handleRefresh = async () => {
        if (profile?.id) {
            await fetchLibrary(profile.id);
        }
        window.location.reload();
    };

    const navItems = [
        { label: t.nav.feed, icon: Home, path: '/feed' },
        { label: t.nav.search, icon: Search, path: '/search' },
        { label: t.nav.community, icon: Users, path: '/community' },
        { label: t.nav.store, icon: Library, path: '/store' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

            {/* Left Section: Status (Reverted to Screenshot Style) */}
            <div className="flex-1 flex items-center gap-4">
                <div
                    onClick={() => navigate('/feed')}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1DB954] to-[#191414] p-0.5 border border-white/10 group-active:scale-95 transition-transform">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                        ) : (
                            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-[10px] font-black">{profile?.username?.substring(0, 2).toUpperCase()}</div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-tight leading-none">LISNET</span>
                        <span className="text-[8px] text-[#1DB954] font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#1DB954] animate-pulse"></span>
                            ONLINE
                        </span>
                    </div>
                </div>
            </div>

            {/* Center Navigation Buttons */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            twMerge(
                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                                isActive ? "text-[#1DB954] bg-[#1DB954]/10" : "text-[#B3B3B3] hover:text-white"
                            )
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Right Section: Actions & Profile */}
            <div className="flex-1 flex items-center justify-end gap-3 md:gap-5">
                <div className="flex items-center gap-3 border-r border-white/5 pr-5">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2 rounded-full text-[#B3B3B3] hover:text-white transition-all active:scale-95"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#1DB954] rounded-full"></span>
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
                        className="text-[9px] font-black text-white bg-white/5 border border-white/10 px-4 py-1.5 rounded-md uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 translate-y-[1px]"
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

                    <button onClick={logout} className="p-2 rounded-full text-white/10 hover:text-red-500 transition-all">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
