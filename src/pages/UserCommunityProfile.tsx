import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    Award,
    ChevronLeft,
    ShieldCheck,
    MoreHorizontal,
    Music2,
    Heart,
    Flame,
    Library,
    Loader2,
    Share2,
    ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { Profile, Track } from '../types';
import { twMerge } from 'tailwind-merge';
import PostGrid from '../components/PostGrid';

const UserCommunityProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile: currentUser } = useAuthStore();
    const { language } = useLanguageStore();
    const t = translations[language].profile;

    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [collectionCount, setCollectionCount] = useState(0);
    const [likesCount, setLikesCount] = useState(0);
    const [postsCount, setPostsCount] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // 1. Fetch Profile
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                setUser(profileData);

                // 2. Fetch Stats
                const [followersResp, followingResp, collResp, likesResp, postsResp] = await Promise.all([
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
                    supabase.from('user_collection').select('*', { count: 'exact', head: true }).eq('user_id', id),
                    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', id),
                    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', id)
                ]);

                setFollowerCount(followersResp.count || 0);
                setFollowingCount(followingResp.count || 0);
                setCollectionCount(collResp.count || 0);
                setLikesCount(likesResp.count || 0);
                setPostsCount(postsResp.count || 0);

                // 3. Check if following
                if (currentUser && currentUser.id !== id) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', currentUser.id)
                        .eq('following_id', id)
                        .maybeSingle();
                    setIsFollowing(!!followData);
                }
            } catch (err) {
                console.error('Error fetching user community profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || !id || followLoading) return;
        try {
            setFollowLoading(true);
            if (isFollowing) {
                await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id);
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id });
                // Notify
                await supabase.from('notifications').insert({
                    user_id: id,
                    actor_id: currentUser.id,
                    type: 'follow',
                    data: { follower_name: currentUser.full_name || currentUser.username, follower_avatar: currentUser.avatar_url }
                });
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error handling follow:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#1DB954]" size={32} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex flex-col gap-6 p-4 pt-6 bg-[#121212] min-h-screen pb-32">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Social Profile</h1>
            </div>

            {/* 1. COMPACT GLASSMORPHIC SOCIAL CARD */}
            <div className="relative group overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1DB954]/10 blur-[50px] rounded-full animate-pulse px-4" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full animate-pulse delay-700" />

                <div className="relative bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-16 h-16 rounded-full border-2 border-[#1DB954] p-1 shadow-[0_0_20px_rgba(29,185,84,0.2)]">
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                alt={user.full_name}
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                            <Library size={12} className="text-[#1DB954]" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{collectionCount} Tracks</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-white tracking-tight leading-none">
                                {user.full_name || user.username}
                            </h2>
                            <ShieldCheck size={16} className="text-[#1DB954]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#1DB954]">@{user.username}</p>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <p className="text-[9px] text-white/40 uppercase font-black tracking-tighter">Community Member</p>
                        </div>
                    </div>

                    {/* Follow Button for others */}
                    {currentUser && currentUser.id !== id && (
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={twMerge(
                                "w-full mt-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
                                isFollowing ? "bg-white/5 text-white/60 border border-white/10" : "bg-white text-black shadow-lg shadow-white/5"
                            )}
                        >
                            {isFollowing ? 'Following' : 'Follow User'}
                        </button>
                    )}

                    {/* Compact Stats Row */}
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

            {/* 2. USER FEED / WALL */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Activity Wall</h3>
                    <div className="flex items-center gap-2" onClick={() => navigate(`/profile/${user.id}`)}>
                        <span className="text-[8px] font-black text-[#1DB954] uppercase tracking-widest cursor-pointer hover:underline">Music Profile</span>
                        <ExternalLink size={10} className="text-[#1DB954]" />
                    </div>
                </div>

                <div className="bg-white/5 rounded-[2rem] border border-white/10 p-2">
                    <PostGrid userId={user.id} />
                </div>
            </div>
        </div>
    );
};

export default UserCommunityProfile;
