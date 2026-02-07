import { NavLink } from 'react-router-dom';
import { Home, Library, User, Search, Users } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';

const BottomNav = () => {
    const { language } = useLanguageStore();
    const t = translations[language].nav;

    const navItems = [
        { label: t.feed, icon: Home, path: '/feed' },
        { label: t.search, icon: Search, path: '/search' },
        { label: t.community, icon: Users, path: '/community' },
        { label: t.store, icon: Library, path: '/store' },
        { label: t.profile, icon: User, path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-black/80 backdrop-blur-md border-t border-white/5 px-4 py-4 flex justify-around items-center z-50 transition-colors pb-8">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        twMerge(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isActive ? "text-white scale-110" : "text-[#B3B3B3] hover:text-white"
                        )
                    }
                >
                    {({ isActive }) => (
                        <>
                            <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium tracking-wide mt-1">{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
