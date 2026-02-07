
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { Music2, MessageCircle } from 'lucide-react';

const LoginPage = () => {
    const { setProfile, setLoading } = useAuthStore();
    const { fetchLibrary } = useLibraryStore();
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Clear background for auth page
        document.body.style.backgroundColor = '#000000';

        // Define the callback function globally so the Telegram widget can find it
        (window as any).onTelegramAuth = async (user: any) => {
            if (user) {
                try {
                    setLoading(true);

                    // Register or login via RPC
                    const { data: userProfile, error } = await supabase.rpc('register_telegram_user', {
                        p_telegram_id: user.id,
                        p_username: user.username || '',
                        p_full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
                        p_avatar_url: user.photo_url || `https://ui-avatars.com/api/?name=${user.username || user.first_name}&background=random`
                    });

                    if (userProfile) {
                        setProfile(userProfile);
                        await fetchLibrary(userProfile.id);
                    } else if (error) {
                        console.error('Auth error:', error);
                    }
                } catch (err) {
                    console.error('Error during Telegram auth:', err);
                } finally {
                    setLoading(false);
                }
            }
        };

        // Inject the Telegram Login Widget script
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', 'lisnet_bot'); // Replace with your BOT username without @
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '12');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        if (widgetRef.current) {
            widgetRef.current.appendChild(script);
        }

        return () => {
            if (widgetRef.current) {
                widgetRef.current.innerHTML = '';
            }
            delete (window as any).onTelegramAuth;
        };
    }, [setProfile, setLoading, fetchLibrary]);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white px-6 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1DB954]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                {/* Logo Area */}
                <div className="w-20 h-20 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-[24px] flex items-center justify-center mb-8 shadow-2xl shadow-[#1DB954]/20 animate-in zoom-in duration-700">
                    <Music2 size={40} className="text-black" />
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-3 animate-in fade-in slide-in-from-bottom-4">
                    LISNET
                </h1>

                <p className="text-white/40 text-sm font-medium mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-500">
                    Connect your world through music and social energy. Authenticate with Telegram to enter.
                </p>

                {/* Login Widget Container */}
                <div className="w-full h-[54px] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div ref={widgetRef} id="telegram-login-container"></div>
                </div>

                <div className="mt-12 flex items-center gap-2 text-[10px] text-white/20 uppercase font-black tracking-[0.2em] animate-in fade-in duration-1000">
                    <MessageCircle size={12} />
                    Secure Telegram OAuth
                </div>
            </div>

            {/* Version Tag */}
            <div className="absolute bottom-8 text-[10px] font-black text-white/10 tracking-widest uppercase">
                Lisnet Web v1.0.4
            </div>
        </div>
    );
};

export default LoginPage;
