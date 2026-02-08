import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Grid, Music, Heart, User, Play, ChevronLeft, Loader2, ListMusic, ShieldCheck, MessageSquare, Users, Instagram, Globe, Disc, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { usePlayerStore } from '../store/usePlayerStore';
import { twMerge } from 'tailwind-merge';
import { Profile, Track } from '../types';
import UserListModal from '../components/UserListModal';
import PostGrid from '../components/PostGrid';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { language } = useLanguageStore();
    const t = translations[language].profile;
    const { setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();

    const location = useLocation();
    const [user, setUser] = useState<Profile | null>(null);
    const [likedTracks, setLikedTracks] = useState<Track[]>([]);
    const [collectionTracks, setCollectionTracks] = useState<Track[]>([]);
    const [artistReleases, setArtistReleases] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'music' | 'collections'>('music');
    const [collectionsSubTab, setCollectionsSubTab] = useState<'main' | 'collection' | 'likes' | 'playlists'>('main');

    // Social state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postsCount, setPostsCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const { profile: currentUser } = useAuthStore();

    // User List Modal State
    const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
    const [userListType, setUserListType] = useState<'followers' | 'following'>('followers');
    const [userListTitle, setUserListTitle] = useState('');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            try {
                setLoading(true);

                // 1. Fetch User Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (profileError) throw profileError;
                setUser(profileData);

                // 2. Fetch User Playlists (only public ones)
                const { data: playlistsData } = await supabase
                    .from('playlists')
                    .select('*')
                    .eq('user_id', id)
                    .eq('is_public', true);
                setPlaylists(playlistsData || []);

                // 3. Fetch Liked Tracks via join
                const { data: likesData } = await supabase
                    .from('likes')
                    .select(`
                        tracks (
                            *,
                            releases (
                                cover_url
                            )
                        )
                    `)
                    .eq('user_id', id);

                if (likesData) {
                    const formattedLikes = likesData.map((item: any) => {
                        const track = item.tracks;
                        const release = Array.isArray(track.releases) ? track.releases[0] : track.releases;

                        return {
                            id: track.id,
                            title: track.title,
                            artistId: track.artist_id || 'unknown',
                            artistName: track.artist_name || 'Unknown Artist',
                            coverUrl: release?.cover_url || '',
                            audioUrl: track.audio_url,
                            duration: track.duration || 0,
                            price: track.price || 0
                        };
                    });
                    setLikedTracks(formattedLikes);
                }

                // 4. Fetch Collection Tracks via join
                const { data: collectionData } = await supabase
                    .from('user_collection')
                    .select(`
                        tracks (
                            *,
                            releases (
                                cover_url
                            )
                        )
                    `)
                    .eq('user_id', id);

                if (collectionData) {
                    const formattedCollection = collectionData.map((item: any) => {
                        const track = item.tracks;
                        const release = Array.isArray(track.releases) ? track.releases[0] : track.releases;

                        return {
                            id: track.id,
                            title: track.title,
                            artistId: track.artist_id || 'unknown',
                            artistName: track.artist_name || 'Unknown Artist',
                            coverUrl: release?.cover_url || '',
                            audioUrl: track.audio_url,
                            duration: track.duration || 0,
                            price: track.price || 0
                        };
                    });
                    setCollectionTracks(formattedCollection);
                }

                // 5. Fetch Artist Releases (Main + Featured)
                const { data: mainReleases } = await supabase
                    .from('releases')
                    .select('*')
                    .eq('artist_id', id);

                // Fetch Post Count
                const { count: postsTotal } = await supabase
                    .from('posts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', id);
                setPostsCount(postsTotal || 0);

                // Fetch releases where user is tagged in tracks
                const { data: featuredReleases } = await supabase
                    .from('releases')
                    .select(`
                        *,
                        tracks!inner (
                            track_artists!inner (
                                artist_id
                            )
                        )
                    `)
                    .eq('tracks.track_artists.artist_id', id);

                const allReleases = [...(mainReleases || []), ...(featuredReleases || [])];
                // Deduplicate by ID
                const uniqueReleases = Array.from(new Map(allReleases.map(item => [item.id, item])).values());
                // Sort
                uniqueReleases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setArtistReleases(uniqueReleases);

                if (!location.state?.activeTab) {
                    if (uniqueReleases.length > 0) setActiveTab('music');
                    else setActiveTab('collections');
                }

                // 6. Fetch Social Stats
                const [followersResp, followingResp] = await Promise.all([
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id)
                ]);

                setFollowerCount(followersResp.count || 0);
                setFollowingCount(followingResp.count || 0);

                if (currentUser && currentUser.id !== id) {
                    const { data: followData } = await supabase
                        .from('follows')
                        .select('*')
                        .eq('follower_id', currentUser.id)
                        .eq('following_id', id)
                        .maybeSingle();
                    setIsFollowing(!!followData);
                } else {
                    setIsFollowing(false);
                }

            } catch (error) {
                console.error('Error fetching user profile:', error);
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
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', id);

                if (error) throw error;
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
            } else {
                // Follow
                const { error: followError } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: currentUser.id,
                        following_id: id
                    });

                if (followError) throw followError;

                // Create Notification
                await supabase.from('notifications').insert({
                    user_id: id,
                    actor_id: currentUser.id,
                    type: 'follow',
                    data: {
                        follower_name: currentUser.full_name || currentUser.username,
                        follower_avatar: currentUser.avatar_url
                    }
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

    const getUserInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handlePlayTrack = (track: Track, list: Track[]) => {
        setCurrentTrack(track);
        setQueue(list);
        setIsPlaying(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#1DB954]" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
                <User size={64} className="text-white/10 mb-4" />
                <h2 className="text-white font-black text-2xl uppercase tracking-widest">{t.not_found}</h2>
                <button onClick={() => navigate(-1)} className="mt-8 text-[#1DB954] font-black uppercase tracking-widest text-sm">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col text-white pb-32">
            {id && (
                <UserListModal
                    isOpen={isUserListModalOpen}
                    onClose={() => setIsUserListModalOpen(false)}
                    userId={id}
                    type={userListType}
                    title={userListTitle}
                />
            )}



            {/* Header / Banner Area */}
            <header className="relative p-6 pt-12 overflow-hidden shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#1DB954]/10 blur-[100px] rounded-full -z-10" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-12 left-6 w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white z-10 hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                    <div className={twMerge(
                        "w-28 h-28 rounded-full border-4 shadow-2xl bg-[#282828] shrink-0 overflow-hidden mb-4 transition-all duration-500",
                        (user.role === 'artist' || user.role === 'admin') ? "border-[#1DB954]" : "border-[#121212]"
                    )}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black italic">
                                {getUserInitials(user.full_name || user.username)}
                            </div>
                        )}
                    </div>

                    <div className="text-center mb-6">
                        <div className="flex flex-col items-center gap-1 px-4">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black uppercase tracking-tighter leading-tight break-words">
                                    {user.full_name || user.username}
                                </h1>
                                {user.role === 'artist' && (
                                    <span className="bg-[#1DB954] text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Artist</span>
                                )}
                                {user.role === 'admin' && (
                                    <span className="bg-white text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter flex items-center gap-1">
                                        <ShieldCheck size={8} /> Admin
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] font-mono text-[#B3B3B3] mt-2 bg-white/5 py-1 px-3 rounded-full inline-block uppercase tracking-widest">
                            {user.username}
                        </p>

                        <div className="mt-4 flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate(`/community/user/${id}`)}
                                className="w-10 h-10 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-[#1DB954] hover:bg-[#1DB954]/20 transition-all active:scale-90"
                                title="Community Profile"
                            >
                                <Users size={18} />
                            </button>

                            <button
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                title="Instagram"
                            >
                                <Instagram size={18} />
                            </button>

                            <button
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                title="Website"
                            >
                                <Globe size={18} />
                            </button>
                        </div>
                    </div>

                    {currentUser && currentUser.id !== id && (
                        <div className="mb-8">
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={twMerge(
                                    "px-10 py-3 rounded-full font-black text-xs uppercase tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 shadow-xl",
                                    isFollowing ? "bg-white/10 text-white border border-white/20" : "bg-white text-black hover:scale-105"
                                )}
                            >
                                {isFollowing ? t.followed : 'Follow'}
                            </button>
                        </div>
                    )}



                    <div className="flex justify-center gap-10 w-full border-t border-white/5 pt-8">
                        <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setActiveTab('posts')}>
                            <span className="block font-black text-xl leading-none">{postsCount}</span>
                            <span className="text-[10px] text-[#B3B3B3] uppercase tracking-widest font-black mt-2">Posts</span>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => {
                                setUserListType('following');
                                setUserListTitle(t.following);
                                setIsUserListModalOpen(true);
                            }}
                        >
                            <span className="block font-black text-xl leading-none">{followingCount}</span>
                            <span className="text-[10px] text-[#B3B3B3] uppercase tracking-widest font-black mt-2">{t.following}</span>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => {
                                setUserListType('followers');
                                setUserListTitle(t.followers);
                                setIsUserListModalOpen(true);
                            }}
                        >
                            <span className="block font-black text-xl leading-none">{followerCount}</span>
                            <span className="text-[10px] text-[#B3B3B3] uppercase tracking-widest font-black mt-2">{t.followers}</span>
                        </div>
                    </div>
                </div>
            </header>


            {/* Tabs */}
            <div className="flex border-b border-white/5 sticky top-0 bg-[#121212]/90 backdrop-blur-md z-20">
                {[
                    { id: 'posts', icon: MessageSquare, label: 'Posts' },
                    { id: 'music', icon: Disc, label: 'Music', show: user.role === 'artist' || user.role === 'admin' },
                    { id: 'collections', icon: Grid, label: 'Collections', show: true }
                ].filter(t => (t as any).show !== false).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            if (tab.id === 'collections') setCollectionsSubTab('main');
                        }}
                        className={twMerge(
                            "flex-1 flex flex-col items-center gap-1.5 py-4 border-b-2 transition-all",
                            activeTab === tab.id ? "border-[#1DB954] text-[#1DB954]" : "border-transparent text-[#B3B3B3]"
                        )}
                    >
                        <tab.icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'music' && (
                    <div className="flex flex-col gap-3">
                        {artistReleases.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center opacity-20 bg-white/5 rounded-3xl border border-white/5">
                                <Disc size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No music released yet</p>
                            </div>
                        ) : (
                            artistReleases.map((release) => (
                                <div
                                    key={release.id}
                                    className="flex items-center gap-4 bg-gradient-to-r from-white/5 to-transparent p-3 rounded-2xl border border-white/5 hover:border-[#1DB954]/30 transition-all group cursor-pointer active:scale-[0.98]"
                                    onClick={() => navigate(`/release/${release.id}`)}
                                >
                                    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl shadow-2xl">
                                        <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-white text-sm truncate uppercase tracking-tight mb-1">{release.title}</h4>
                                        <p className="text-[10px] text-[#B3B3B3] truncate font-mono uppercase tracking-widest">{release.genre} • {new Date(release.created_at).getFullYear()}</p>
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-[#1DB954] group-hover:text-black transition-all">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {activeTab === 'posts' && (
                    <PostGrid userId={id!} />
                )}
                {activeTab === 'collections' && (
                    <div className="flex flex-col gap-4">
                        {collectionsSubTab === 'main' ? (
                            <div className="flex flex-col gap-2">
                                <div
                                    onClick={() => setCollectionsSubTab('collection')}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954]">
                                            <Music size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase tracking-tight">Collection</h4>
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{collectionTracks.length} items</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-[#B3B3B3] group-hover:text-white transition-colors" />
                                </div>

                                <div
                                    onClick={() => setCollectionsSubTab('likes')}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                                            <Heart size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase tracking-tight">Likes (Wishlist)</h4>
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{likedTracks.length} items</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-[#B3B3B3] group-hover:text-white transition-colors" />
                                </div>

                                <div
                                    onClick={() => setCollectionsSubTab('playlists')}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                            <ListMusic size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase tracking-tight">Playlists</h4>
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{playlists.length} items</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-[#B3B3B3] group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => setCollectionsSubTab('main')}
                                    className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-2"
                                >
                                    <ChevronLeft size={16} />
                                    Back to Collections
                                </button>

                                {collectionsSubTab === 'collection' && (
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Collection</h3>
                                        {collectionTracks.length > 0 ? (
                                            collectionTracks.map(track => (
                                                <div
                                                    key={track.id}
                                                    onClick={() => handlePlayTrack(track, collectionTracks)}
                                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                                                >
                                                    <div className="w-14 h-14 bg-[#282828] rounded-xl overflow-hidden shadow-lg shrink-0 relative">
                                                        {track.coverUrl ? (
                                                            <img
                                                                src={track.coverUrl}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                                                <Music size={20} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3] hidden bg-[#282828]">
                                                            <Music size={20} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white truncate text-sm">{track.title}</h4>
                                                        <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1 truncate">{track.artistName}</p>
                                                    </div>
                                                    <div className="w-9 h-9 flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                                <Music size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-xs">Collection is private or empty</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {collectionsSubTab === 'likes' && (
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Likes (Wishlist)</h3>
                                        {likedTracks.length > 0 ? (
                                            likedTracks.map(track => (
                                                <div
                                                    key={track.id}
                                                    onClick={() => handlePlayTrack(track, likedTracks)}
                                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                                                >
                                                    <div className="w-14 h-14 bg-[#282828] rounded-xl overflow-hidden shadow-lg shrink-0 relative">
                                                        {track.coverUrl ? (
                                                            <img
                                                                src={track.coverUrl}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                                                <Music size={20} />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center text-[#B3B3B3] hidden bg-[#282828]">
                                                            <Music size={20} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white truncate text-sm">{track.title}</h4>
                                                        <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1 truncate">{track.artistName}</p>
                                                    </div>
                                                    <div className="w-9 h-9 flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                                <Heart size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-xs">No liked tracks</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {collectionsSubTab === 'playlists' && (
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Playlists</h3>
                                        {playlists.length > 0 ? (
                                            playlists.map(playlist => (
                                                <div
                                                    key={playlist.id}
                                                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                                                >
                                                    <div className="w-16 h-16 bg-[#282828] rounded-xl overflow-hidden shadow-lg shrink-0 border border-white/10">
                                                        {playlist.cover_url ? (
                                                            <img src={playlist.cover_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                                <ListMusic size={28} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white truncate text-sm">{playlist.title}</h4>
                                                        <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">Playlist</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center opacity-20">
                                                <ListMusic size={48} className="mb-4" />
                                                <p className="font-black uppercase tracking-widest text-xs">No public playlists</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
