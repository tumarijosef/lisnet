import { X, Check, ChevronRight, ChevronLeft, Globe, Palette, LogOut } from 'lucide-react';
import { useLanguageStore, Language } from '../store/useLanguageStore';
import { useThemeStore, Theme } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { translations } from '../lib/translations';
import { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' },
    { code: 'kaa', name: 'Qaraqalpaq', flag: '🇺🇿' },
    { code: 'kk', name: 'Қазақ', flag: '🇰🇿' },
    { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
    { code: 'tg', name: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

const themes: { id: Theme; name: string; desc: string }[] = [
    { id: 'original', name: 'Original Lisnetapp', desc: 'Modern & Slick' },
    { id: 'skynet', name: 'Skynet Theme', desc: 'Winamp Retro Style' }
];

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { language, setLanguage } = useLanguageStore();
    const { theme, setTheme } = useThemeStore();
    const [view, setView] = useState<'main' | 'language' | 'theme'>('main');

    const t = translations[language].settings;

    if (!isOpen) return null;

    const currentLangName = languages.find(l => l.code === language)?.name || 'English';

    return (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#181818] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 min-h-[400px]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        {view !== 'main' && (
                            <button onClick={() => setView('main')} className="mr-2 p-1 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronLeft size={20} className="text-[#B3B3B3]" />
                            </button>
                        )}
                        <h3 className="text-xl font-black tracking-tighter text-white uppercase">
                            {view === 'main' ? t.title : view === 'language' ? t.choose_language : 'Theme'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-[#B3B3B3]" />
                    </button>
                </div>

                {/* Main View */}
                {view === 'main' && (
                    <div className="p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setView('language')}
                            className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954]">
                                    <Globe size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-widest text-[#B3B3B3] mb-0.5">{t.language}</p>
                                    <p className="font-bold text-white text-base">{currentLangName}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                        </button>

                        <button
                            onClick={() => setView('theme')}
                            className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954]">
                                    <Palette size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-widest text-[#B3B3B3] mb-0.5">Theme</p>
                                    <p className="font-bold text-white text-base">
                                        {themes.find(th => th.id === theme)?.name}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                        </button>

                        <div className="h-[1px] bg-white/5 my-4 mx-4" />

                        <button
                            onClick={() => {
                                onClose();
                                useAuthStore.getState().logout();
                            }}
                            className="flex items-center gap-4 p-5 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <LogOut size={20} />
                            </div>
                            <span className="font-bold text-base uppercase tracking-tighter">Log Out</span>
                        </button>
                    </div>
                )}

                {/* Language View */}
                {view === 'language' && (
                    <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 gap-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setTimeout(() => setView('main'), 200);
                                    }}
                                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${language === lang.code
                                        ? 'bg-[#1DB954]/10 text-[#1DB954]'
                                        : 'hover:bg-white/5 text-[#B3B3B3]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{lang.flag}</span>
                                        <span className="font-bold text-sm tracking-tight">{lang.name}</span>
                                    </div>
                                    {language === lang.code && <Check size={18} strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Theme View */}
                {view === 'theme' && (
                    <div className="p-4 flex flex-col gap-2">
                        {themes.map((th) => (
                            <button
                                key={th.id}
                                onClick={() => {
                                    setTheme(th.id);
                                    setTimeout(() => setView('main'), 200);
                                }}
                                className={`flex items-center justify-between p-5 rounded-2xl transition-all border ${theme === th.id
                                    ? 'bg-[#1DB954]/10 border-[#1DB954]/30 text-[#1DB954]'
                                    : 'bg-white/5 border-transparent text-[#B3B3B3] hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className="font-black text-base uppercase tracking-tighter">{th.name}</p>
                                    <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mt-1">{th.desc}</p>
                                </div>
                                {theme === th.id && <Check size={20} strokeWidth={3} />}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mb-8 flex justify-center">
                    <div className="w-12 h-1 bg-white/10 rounded-full sm:hidden" />
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
