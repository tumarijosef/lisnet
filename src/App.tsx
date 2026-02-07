import { Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
    const { loading, profile } = useAuthStore();
    useTelegram(); // Initialize Telegram WebApp and sync user
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('theme-original', 'theme-skynet');
        root.classList.add(`theme-${theme}`);
    }, [theme]);

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
