import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Library, User, Search, Users, LogOut, Settings } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { useAuthStore } from '../store/useAuthStore';

const Sidebar = () => {
    const { language } = useLanguageStore();
    const { profile, logout } = useAuthStore();
    const navigate = useNavigate();
    const t = translations[language].nav;

    const navItems = [
        { label: translations[language].nav.feed, icon: Home, path: '/feed' },
        { label: translations[language].nav.search, icon: Search, path: '/search' },
        { label: translations[language].nav.community, icon: Users, path: '/community' },
        { label: translations[language].nav.store, icon: Library, path: '/store' },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-white/5 flex flex-col p-6 z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/feed')}>
                <div className="w-8 h-8 bg-[#1DB954] rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
                </div>
                <h1 className="text-xl font-black tracking-tighter uppercase">Lisnet</h1>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            twMerge(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-[#1DB954]/10 text-[#1DB954]"
                                    : "text-[#B3B3B3] hover:text-white hover:bg-white/5"
                            )
                        }
                    >
                        <item.icon size={22} />
                        <span className="font-bold tracking-tight uppercase text-xs">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="mt-auto border-t border-white/5 pt-6 flex flex-col gap-4">
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        twMerge(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                            isActive ? "bg-white/10" : "hover:bg-white/5"
                        )
                    }
                >
                    <div className={twMerge(
                        "w-10 h-10 rounded-full border-2 overflow-hidden shrink-0",
                        profile?.role === 'admin' ? "border-[#FFD700]" :
                            profile?.role === 'artist' ? "border-[#1DB954]" : "border-white/10"
                    )}>
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate truncate uppercase tracking-tighter">
                            {profile?.full_name || profile?.username}
                        </p>
                        <p className="text-[10px] text-[#B3B3B3] font-bold">@{profile?.username}</p>
                    </div>
                </NavLink>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-[#B3B3B3] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
