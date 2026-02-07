import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { Music2, MessageCircle, Smartphone } from 'lucide-react';

const LoginPage = () => {
    const { setProfile, setLoading: setStoreLoading } = useAuthStore();
    const { fetchLibrary } = useLibraryStore();
    const widgetRef = useRef<HTMLDivElement>(null);
    const [authMode, setAuthMode] = useState<'selection' | 'widget' | 'mini-app'>('selection');
    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

    useEffect(() => {
        document.body.style.backgroundColor = '#000000';

        (window as any).onTelegramAuth = async (user: any) => {
            if (user) handleAuthSuccess(user);
        };

        return () => {
            delete (window as any).onTelegramAuth;
        };
    }, []);

    // Polling for Mini App confirmation
    useEffect(() => {
        if (!pendingSessionId || authMode !== 'mini-app') return;

        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('web_auth_sessions')
                .select('*')
                .eq('id', pendingSessionId)
                .single();

            if (data && data.status === 'confirmed' && data.user_data) {
                console.log('Login confirmed from polling!');
                clearInterval(interval);
                handleAuthSuccess(data.user_data);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [pendingSessionId, authMode]);

    const handleAuthSuccess = async (user: any) => {
        try {
            setStoreLoading(true);
            const { data: userProfile } = await supabase.rpc('register_telegram_user', {
                p_telegram_id: user.id,
                p_username: user.username || '',
                p_full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
                p_avatar_url: user.photo_url || `https://ui-avatars.com/api/?name=${user.username || user.first_name}&background=random`
            });

            if (userProfile) {
                setProfile(userProfile);
                await fetchLibrary(userProfile.id);
            }
        } catch (err) {
            console.error('Auth error:', err);
        } finally {
            setStoreLoading(false);
        }
    };

    const startMiniAppAuth = async () => {
        try {
            setAuthMode('mini-app');

            const { data, error } = await supabase
                .from('web_auth_sessions')
                .insert([{ status: 'pending' }])
                .select()
                .single();

            if (data) {
                setPendingSessionId(data.id);
                console.log('Session initialized:', data.id);
            } else {
                console.error('Failed to init session:', error);
                setAuthMode('selection');
            }
        } catch (err) {
            console.error('Failed to start session:', err);
            setAuthMode('selection');
        }
    };

    const loadWidget = () => {
        setAuthMode('widget');
        setTimeout(() => {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.setAttribute('data-telegram-login', 'lisnet_bot');
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-radius', '12');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.setAttribute('data-request-access', 'write');
            script.async = true;
            if (widgetRef.current) widgetRef.current.appendChild(script);
        }, 100);
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white px-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1DB954]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-[24px] flex items-center justify-center mb-8 shadow-2xl shadow-[#1DB954]/20 animate-in zoom-in duration-700">
                    <Music2 size={40} className="text-black" />
                </div>

                <h1 className="text-4xl font-black tracking-tighter mb-3 uppercase">LISNET</h1>
                <p className="text-white/40 text-sm font-medium mb-12">Connect your world through music.</p>

                {authMode === 'selection' && (
                    <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={startMiniAppAuth}
                            className="w-full h-14 bg-[#1DB954] text-black rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Smartphone size={20} />
                            Login via Telegram App
                        </button>
                        <button
                            onClick={loadWidget}
                            className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-wider hover:bg-white/10 transition-all font-sans"
                        >
                            <MessageCircle size={20} />
                            Use Phone Number
                        </button>
                    </div>
                )}

                {authMode === 'mini-app' && (
                    <div className="flex flex-col items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/10 w-full animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin" />
                            <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1DB954]" size={24} />
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="font-bold text-white uppercase text-xs tracking-widest">Waiting for confirmation</p>
                                <p className="text-white/40 text-[10px] leading-relaxed uppercase font-black tracking-widest leading-4">Confirm login on your device</p>
                            </div>

                            {pendingSessionId ? (
                                <div className="flex flex-col gap-3">
                                    <a
                                        href={`https://t.me/lisnet_bot/app?startapp=auth_${pendingSessionId}`}
                                        className="inline-block px-8 py-5 bg-[#0088cc] text-white rounded-2xl font-black text-[14px] uppercase tracking-widest hover:bg-[#0099e6] transition-all shadow-xl shadow-[#0088cc]/30 active:scale-95"
                                    >
                                        Log In with Telegram
                                    </a>
                                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-tight">Clicking above will open Telegram</p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-white/20 uppercase font-black">Initializing session...</p>
                            )}
                        </div>
                        <button onClick={() => setAuthMode('selection')} className="text-[10px] text-white/30 uppercase font-black hover:text-white transition-colors text-center w-full mt-4">Go Back</button>
                    </div>
                )}

                {authMode === 'widget' && (
                    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-500">
                        <div className="w-full h-[54px] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                            <div ref={widgetRef}></div>
                        </div>
                        <button onClick={() => setAuthMode('selection')} className="text-[10px] text-white/30 uppercase font-black hover:text-white">Back to options</button>
                    </div>
                )}

                <div className="mt-12 flex items-center gap-2 text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">
                    <MessageCircle size={12} />
                    Secure Telegram OAuth
                </div>
            </div>

            <div className="absolute bottom-8 text-[10px] font-black text-white/10 tracking-widest uppercase">
                Lisnet Web v1.0.6
            </div>
        </div>
    );
};

export default LoginPage;
