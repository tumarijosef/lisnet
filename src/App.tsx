import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import Store from './pages/Store';
import Profile from './pages/Profile';
import LikedTracks from './pages/LikedTracks';
import PlaylistDetails from './pages/PlaylistDetails';
import Search from './pages/Search';
import ReleaseDetails from './pages/ReleaseDetails';
import UserProfile from './pages/UserProfile';
import Community from './pages/Community';
import UserCommunityProfile from './pages/UserCommunityProfile';
import PostDetails from './pages/PostDetails';
import Checkout from './pages/Checkout';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Users from './pages/admin/Users';
import MusicLibrary from './pages/admin/MusicLibrary';
import Finance from './pages/admin/Finance';
import Requests from './pages/admin/Requests';
import ArtistManageReleases from './pages/ArtistManageReleases';
import LoginPage from './pages/Login';
import { useTelegram } from './hooks/useTelegram';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';

function App() {
    const { loading, profile, webAuthConfirmed, setWebAuthConfirmed, refreshProfile, setLoading } = useAuthStore();
    const { tg } = useTelegram();
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('theme-original', 'theme-skynet');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await refreshProfile();
                }
            } catch (err) {
                console.error('Auth init error:', err);
            } finally {
                // In Telegram, we wait for useTelegram to set loading to false
                if (!(window as any).Telegram?.WebApp?.initData) {
                    setLoading(false);
                }
            }
        };
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                await refreshProfile();
            } else if (event === 'SIGNED_OUT') {
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [refreshProfile, setLoading]);

    // Update last_seen heartbeat
    useEffect(() => {
        if (!profile?.id) return;

        const updateLastSeen = async () => {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', profile.id);
            } catch (err) {
                console.error('Error updating last seen:', err);
            }
        };

        // Update once on mount
        updateLastSeen();

        // Then every 2 minutes
        const interval = setInterval(updateLastSeen, 120000);
        return () => clearInterval(interval);
    }, [profile?.id]);

    if (webAuthConfirmed) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-8 text-center">
                <div className="w-24 h-24 bg-[#1DB954] rounded-full flex items-center justify-center mb-10 shadow-3xl shadow-[#1DB954]/20 animate-bounce-subtle">
                    <Check size={48} className="text-black stroke-[3px]" />
                </div>
                <h1 className="text-3xl font-black mb-4 uppercase tracking-tighter">Login Confirmed!</h1>
                <p className="text-white/50 text-sm font-medium leading-relaxed mb-12">
                    Success! You are now logged in. Return to your browser or continue here.
                </p>
                <button
                    onClick={() => setWebAuthConfirmed(false)}
                    className="h-14 px-10 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-wider hover:scale-[1.05] transition-all"
                >
                    Continue in App
                    <ArrowRight size={18} />
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return <LoginPage />;
    }

    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/feed" replace />} />
                <Route path="feed" element={<Feed />} />
                <Route path="search" element={<Search />} />
                <Route path="store" element={<Store />} />
                <Route path="community" element={<Community />} />
                <Route path="community/user/:id" element={<UserCommunityProfile />} />
                <Route path="post/:id" element={<PostDetails />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:id" element={<UserProfile />} />
                <Route path="artist/manage" element={<ArtistManageReleases />} />
                <Route path="liked-tracks" element={<LikedTracks />} />
                <Route path="playlist/:id" element={<PlaylistDetails />} />
                <Route path="release/:id" element={<ReleaseDetails />} />
                <Route path="checkout" element={<Checkout />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="users" element={<Users />} />
                <Route path="library" element={<MusicLibrary />} />
                <Route path="requests" element={<Requests />} />
                <Route path="finance" element={<Finance />} />
            </Route>
        </Routes>
    );
}

export default App;
