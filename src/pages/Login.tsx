import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { Music2, MessageCircle, Smartphone, QrCode, Copy, Check } from 'lucide-react';

const LoginPage = () => {
    const { setProfile, setLoading: setStoreLoading } = useAuthStore();
    const { fetchLibrary } = useLibraryStore();
    const widgetRef = useRef<HTMLDivElement>(null);
    const [authMode, setAuthMode] = useState<'selection' | 'widget' | 'mini-app'>('selection');
    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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
                clearInterval(interval);
                handleAuthSuccess(data.user_data);
            }
        }, 1500);

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
            const { data } = await supabase
                .from('web_auth_sessions')
                .insert([{ status: 'pending' }])
                .select()
                .single();

            if (data) {
                setPendingSessionId(data.id);
            }
        } catch (err) {
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

    const tgLink = `https://t.me/lisnet_bot/app?startapp=auth_${pendingSessionId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(tgLink)}&bgcolor=141414&color=1DB954`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tgLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white px-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1DB954]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-[20px] flex items-center justify-center mb-6 shadow-2xl shadow-[#1DB954]/20">
                    <Music2 size={32} className="text-black" />
                </div>

                <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase">LISNET</h1>
                <p className="text-white/40 text-[11px] font-medium mb-10">Connect your world through music.</p>

                {authMode === 'selection' && (
                    <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={startMiniAppAuth}
                            className="w-full h-14 bg-[#1DB954] text-black rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Smartphone size={18} />
                            Login via Telegram App
                        </button>
                        <button
                            onClick={loadWidget}
                            className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                        >
                            <MessageCircle size={18} />
                            Use Phone Number
                        </button>
                    </div>
                )}

                {authMode === 'mini-app' && (
                    <div className="flex flex-col items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/10 w-full animate-in fade-in zoom-in duration-300">
                        <div className="space-y-4 w-full">
                            <div className="flex flex-col items-center gap-2">
                                <p className="font-bold text-white uppercase text-[10px] tracking-widest">Waiting for App</p>
                                <p className="text-white/40 text-[9px] uppercase font-black tracking-widest leading-3 px-8 text-center">Scan QR with phone OR click button</p>
                            </div>

                            <div className="w-48 h-48 bg-[#141414] rounded-3xl p-4 border border-white/5 mx-auto flex items-center justify-center relative">
                                {pendingSessionId ? (
                                    <img src={qrUrl} alt="QR Code" className="w-full h-full opacity-90" />
                                ) : (
                                    <div className="w-8 h-8 border-2 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin" />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <a
                                    href={tgLink}
                                    className="w-full h-12 bg-[#0088cc] text-white rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-[#0099e6] transition-all"
                                >
                                    Open Telegram
                                </a>
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full h-10 bg-white/5 text-white/40 rounded-xl flex items-center justify-center gap-2 font-bold text-[9px] uppercase tracking-widest hover:text-white transition-all"
                                >
                                    {copied ? <Check size={12} className="text-[#1DB954]" /> : <Copy size={12} />}
                                    {copied ? 'Copied' : 'Copy Direct Link'}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setAuthMode('selection')} className="text-[9px] text-white/30 uppercase font-black hover:text-white pt-2">Go Back</button>
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
            </div>

            <div className="absolute bottom-8 text-[9px] font-black text-white/10 tracking-[0.3em] uppercase">
                Lisnet Web v1.0.8
            </div>
        </div>
    );
};

export default LoginPage;
