import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Library,
    ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { useLibraryStore } from '../store/useLibraryStore';
import CreatePostModal from '../components/CreatePostModal';
import CommunityFeed from '../components/CommunityFeed';
import { Plus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Community = () => {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const { language } = useLanguageStore();
    const { collectionTrackIds } = useLibraryStore();

    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postsCount, setPostsCount] = useState(0);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [feedKey, setFeedKey] = useState(0);

    const fetchData = async () => {
        if (!profile) return;
        try {
            // 1. Fetch Follow Stats
            const [followersResp, followingResp, postsResp] = await Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
                supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
            ]);
            setFollowerCount(followersResp.count || 0);
            setFollowingCount(followingResp.count || 0);
            setPostsCount(postsResp.count || 0);

            // 2. Fetch Suggested Users (excluding self)
            const { data: users } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, role')
                .neq('id', profile.id)
                .limit(8);
            setSuggestedUsers(users || []);
        } catch (err) {
            console.error('Error fetching community data:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profile]);

    const handlePostSuccess = () => {
        setFeedKey(prev => prev + 1);
        fetchData(); // Refresh stats
    };

    if (!profile) return null;

    return (
        <div className="flex flex-col gap-6 p-4 pt-6 pb-32">
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handlePostSuccess}
            />

            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-black tracking-tighter uppercase text-white">Community</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-[#1DB954] text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#1DB954]/20 active:scale-95 transition-all"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>New Post</span>
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {/* 1. COMPACT GLASSMORPHIC SOCIAL CARD */}
                <div
                    className="relative group overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                    onClick={() => navigate('/profile', { state: { activeTab: 'posts' } })}
                >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1DB954]/10 blur-[50px] rounded-full animate-pulse px-4" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full animate-pulse delay-700" />

                    <div className="relative bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className={twMerge(
                                "w-16 h-16 rounded-full border-2 p-1 transition-all duration-500",
                                profile.role === 'admin' ? "border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]" :
                                    profile.role === 'artist' ? "border-[#1DB954] shadow-[0_0_20px_rgba(29,185,84,0.3)]" : "border-[#1DB954]/20"
                            )}>
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                                <Library size={12} className="text-[#1DB954]" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">{collectionTrackIds.length} Tracks</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-white tracking-tight leading-none">
                                {profile.full_name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-[#1DB954]">
                                    @{profile.username || `tg_${profile.telegram_id}`}
                                </p>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <p className="text-[9px] text-white/40 uppercase font-black tracking-tighter">
                                    {profile.role === 'admin' ? 'System Administrator' : profile.role === 'artist' ? 'Verified Artist' : 'Telegram Member'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-6">
                            <div className="bg-white/5 py-2.5 rounded-xl border border-white/5 text-center">
                                <p className="text-base font-black text-white">{postsCount}</p>
                                <p className="text-[7px] text-white/40 uppercase font-black tracking-widest mt-0.5">Posts</p>
                            </div>
                            <div className="bg-white/5 py-2.5 rounded-xl border border-white/5 text-center">
                                <p className="text-base font-black text-white">{followerCount}</p>
                                <p className="text-[7px] text-white/40 uppercase font-black tracking-widest mt-0.5">Followers</p>
                            </div>
                            <div className="bg-white/5 py-2.5 rounded-xl border border-white/5 text-center">
                                <p className="text-base font-black text-white">{followingCount}</p>
                                <p className="text-[7px] text-white/40 uppercase font-black tracking-widest mt-0.5">Following</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SUGGESTED CURATORS */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Top Curators</h3>
                        <button onClick={() => navigate('/search')} className="text-[8px] font-black text-[#1DB954] uppercase tracking-widest px-2 py-1 rounded-md bg-white/5">View All</button>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar px-1">
                        {suggestedUsers.map((u) => (
                            <div
                                key={u.id}
                                onClick={() => navigate(`/profile/${u.id}`, { state: { activeTab: 'posts' } })}
                                className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-3 shrink-0 w-28 active:scale-95 transition-all text-center group"
                            >
                                <div className={twMerge(
                                    "w-14 h-14 rounded-full overflow-hidden border-2 p-1 transition-all duration-500",
                                    u.role === 'admin' ? "border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]" :
                                        u.role === 'artist' ? "border-[#1DB954] shadow-[0_0_10px_rgba(29,185,84,0.2)]" : "border-white/10"
                                )}>
                                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`} className="w-full h-full object-cover rounded-full" alt="" />
                                </div>
                                <div className="min-w-0 w-full">
                                    <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{u.full_name || u.username}</p>
                                    <p className="text-[8px] text-[#1DB954] font-bold mt-0.5">@{u.username}</p>
                                </div>
                            </div>
                        ))}
                        {loadingUsers && [1, 2, 3].map(i => (
                            <div key={i} className="bg-white/5 p-4 rounded-3xl w-28 h-32 animate-pulse shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. COMMUNITY FEED */}
            <div className="flex flex-col gap-4">
                <div className="px-2">
                    <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Community Feed</h3>
                </div>
                <CommunityFeed key={feedKey} />
            </div>

            <div className="mt-8 px-4 py-8 border-t border-white/5 text-center">
                <p className="text-[8px] text-white/10 font-mono uppercase tracking-[0.4em]">LISNET SOCIAL PROTOCOL v1.0</p>
            </div>
        </div>
    );
};

export default Community;
