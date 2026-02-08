import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { Music2, MessageCircle, Smartphone, QrCode, Copy, Check, ExternalLink } from 'lucide-react';

const LoginPage = () => {
    const { setProfile, setLoading: setStoreLoading } = useAuthStore();
    const { fetchLibrary } = useLibraryStore();
    const widgetRef = useRef<HTMLDivElement>(null);
    const [authMode, setAuthMode] = useState<'selection' | 'widget' | 'mini-app' | 'success' | 'email'>('selection');
    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

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
                setUserData(data.user_data);
                setAuthMode('success');
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

    const enterSite = () => {
        if (userData) {
            handleAuthSuccess(userData);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        setLoginError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0],
                        }
                    }
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setLoginError(error.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            setLoginError(error.message);
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

            if (data) setPendingSessionId(data.id);
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

    // More universal link formats
    const tgLinkApp = `https://t.me/lisnet_bot/app?startapp=auth_${pendingSessionId}`;
    const tgLinkDirect = `https://t.me/lisnet_bot?startapp=auth_${pendingSessionId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(tgLinkApp)}&bgcolor=141414&color=1DB954`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tgLinkApp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white px-6 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1DB954]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
                <div className="mb-10 animate-in zoom-in duration-700">
                    <div className="relative w-48 h-20 flex items-center justify-center">
                        {/* Orbital Swirl */}
                        <svg viewBox="0 0 200 80" className="absolute w-full h-full opacity-30">
                            <ellipse
                                cx="100" cy="40" rx="90" ry="35"
                                fill="none" stroke="white" strokeWidth="0.5"
                                className="animate-[pulse_4s_ease-in-out_infinite]"
                                transform="rotate(-5, 100, 40)"
                            />
                        </svg>

                        {/* LisNet Text */}
                        <div className="relative flex items-center font-sans tracking-tight">
                            <span className="text-5xl font-black text-[#1DB954] relative">
                                L
                                <span className="relative">
                                    i
                                    <span className="absolute -top-1 left-1.5 w-2 h-2 bg-[#1DB954] rounded-full shadow-[0_0_10px_#1DB954]" />
                                </span>
                                s
                            </span>
                            <span className="text-5xl font-black text-white ml-0.5">Net</span>
                        </div>
                    </div>
                </div>

                <h1 className="sr-only">LISNET</h1>

                {authMode === 'selection' && (
                    <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={startMiniAppAuth}
                            className="w-full h-14 bg-[#1DB954] text-black rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#1DB954]/20"
                        >
                            <Smartphone size={18} />
                            Login via Telegram App
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleGoogleAuth}
                                className="h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button>
                            <button
                                onClick={() => setAuthMode('email')}
                                className="h-14 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all"
                            >
                                <MessageCircle size={18} />
                                Email
                            </button>
                        </div>

                        <button
                            onClick={loadWidget}
                            className="w-full h-12 text-white/20 hover:text-white/40 font-black text-[9px] uppercase tracking-[0.3em] transition-colors mt-2"
                        >
                            Telegram Phone Login
                        </button>
                    </div>
                )}

                {authMode === 'email' && (
                    <div className="w-full space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-wider">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                            <p className="text-white/40 text-[9px] uppercase font-bold tracking-[0.2em]">
                                {isSignUp ? 'Join the Lisnet production network' : 'Login with your production email'}
                            </p>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-3">
                            <div className="space-y-1">
                                <input
                                    type="email"
                                    placeholder="EMAIL ADDRESS"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <input
                                    type="password"
                                    placeholder="PASSWORD"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all outline-none"
                                    required
                                />
                            </div>

                            {loginError && (
                                <p className="text-[#FF0000] text-[8px] uppercase font-bold tracking-widest text-center animate-shake">
                                    {loginError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={localLoading}
                                className="w-full h-14 bg-[#1DB954] text-black rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#1DB954]/20 disabled:opacity-50"
                            >
                                {localLoading ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    isSignUp ? 'Sign Up' : 'Login'
                                )}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-[9px] text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors"
                            >
                                {isSignUp ? 'Already have an account? Login' : 'New to Lisnet? Create Account'}
                            </button>
                            <button
                                onClick={() => {
                                    setAuthMode('selection');
                                    setLoginError(null);
                                }}
                                className="text-[9px] text-[#1DB954] font-black uppercase tracking-[0.3em] hover:brightness-110"
                            >
                                ← Back to options
                            </button>
                        </div>
                    </div>
                )}

                {authMode === 'mini-app' && (
                    <div className="flex flex-col items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/10 w-full animate-in fade-in zoom-in duration-300">
                        <div className="space-y-4 w-full">
                            <div className="flex flex-col items-center gap-1">
                                <p className="font-bold text-white uppercase text-[9px] tracking-[0.2em]">Authentication Required</p>
                                <p className="text-white/20 text-[8px] uppercase font-bold tracking-widest leading-3 px-8 text-center">Scan QR or use direct buttons</p>
                            </div>

                            <div className="w-44 h-44 bg-[#141414] rounded-2xl p-4 border border-white/5 mx-auto flex items-center justify-center relative shadow-inner">
                                {pendingSessionId ? (
                                    <img src={qrUrl} alt="QR Code" className="w-full h-full opacity-100" />
                                ) : (
                                    <div className="w-8 h-8 border-2 border-[#1DB954]/20 border-t-[#1DB954] rounded-full animate-spin" />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <a
                                    href={tgLinkApp}
                                    className="w-full h-12 bg-[#1DB954] text-black rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#1DB954]/10"
                                >
                                    Login with App
                                    <ExternalLink size={12} />
                                </a>
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={tgLinkDirect}
                                        className="h-10 bg-white/5 text-white/60 rounded-xl flex items-center justify-center font-bold text-[8px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Alt Link
                                    </a>
                                    <button
                                        onClick={copyToClipboard}
                                        className="h-10 bg-white/5 text-white/60 rounded-xl flex items-center justify-center gap-2 font-bold text-[8px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        {copied ? <Check size={10} className="text-[#1DB954]" /> : <Copy size={10} />}
                                        {copied ? 'Done' : 'Copy link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setAuthMode('selection')} className="text-[9px] text-white/30 uppercase font-black hover:text-white pt-2 tracking-widest">Cancel</button>
                    </div>
                )}

                {authMode === 'widget' && (
                    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in duration-500">
                        <div className="w-full h-[54px] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                            <div ref={widgetRef}></div>
                        </div>
                        <button onClick={() => setAuthMode('selection')} className="text-[10px] text-white/30 uppercase font-black hover:text-white pt-4">Back to home</button>
                    </div>
                )}

                {authMode === 'success' && (
                    <div className="flex flex-col items-center gap-6 p-10 bg-white/5 rounded-[40px] border border-[#1DB954]/30 w-full animate-in zoom-in duration-500 shadow-2xl shadow-[#1DB954]/10">
                        <div className="w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg shadow-[#1DB954]/20 animate-bounce-subtle">
                            <Check size={40} className="text-black stroke-[3px]" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tighter">Welcome back!</h2>
                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Authentication successful</p>
                        </div>
                        <button
                            onClick={enterSite}
                            className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            Enter Lisnet
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 flex items-center gap-4">
                <div className="h-px w-6 bg-white/5"></div>
                <div className="text-[9px] font-black text-white/10 tracking-[0.4em] uppercase">Lisnet Web v1.1.6</div>
                <div className="h-px w-6 bg-white/5"></div>
            </div>
        </div>
    );
};

export default LoginPage;
