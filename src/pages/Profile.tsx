import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Grid, Music, Heart, Camera, Loader2, Check, User, Edit3, Play, Sparkles, ShieldCheck, Landmark, Settings as SettingsIcon, Disc, ChevronRight, Plus, X, ChevronLeft, MessageSquare, ListMusic } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import SettingsModal from '../components/SettingsModal';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTracks } from '../hooks/useTracks';
import UserListModal from '../components/UserListModal';
import PostGrid from '../components/PostGrid';


const Profile = () => {
    const { setCurrentTrack, setQueue, setIsPlaying } = usePlayerStore();
    const { likedTrackIds, collectionTrackIds } = useLibraryStore();
    const [activeTab, setActiveTab] = useState<'posts' | 'music' | 'collections'>('collections');
    const [collectionsSubTab, setCollectionsSubTab] = useState<'main' | 'collection' | 'likes' | 'playlists'>('main');
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, setProfile, loading: authLoading } = useAuthStore();
    const { tracks } = useTracks();
    const { language } = useLanguageStore();
    const t = translations[language].profile;

    const [applicationStatus, setApplicationStatus] = useState<'pending' | 'none' | null>(null);
    const [artistReleases, setArtistReleases] = useState<any[]>([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [postsCount, setPostsCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newName, setNewName] = useState(profile?.full_name || '');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
    const [userListType, setUserListType] = useState<'followers' | 'following'>('followers');
    const [userListTitle, setUserListTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }

        const fetchFollowStats = async () => {
            if (!profile) return;
            try {
                const [followersResp, followingResp, postsResp] = await Promise.all([
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
                    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
                ]);
                setFollowerCount(followersResp.count || 0);
                setFollowingCount(followingResp.count || 0);
                setPostsCount(postsResp.count || 0);
            } catch (err) {
                console.error('Error fetching follow stats:', err);
            }
        };

        const fetchApplication = async () => {
            if (!profile || profile.role === 'artist' || profile.role === 'admin') return;
            const { data } = await supabase
                .from('artist_applications')
                .select('status')
                .eq('user_id', profile.id)
                .eq('status', 'pending')
                .maybeSingle();

            if (data) setApplicationStatus('pending');
            else setApplicationStatus('none');
        };

        const fetchArtistMusic = async () => {
            if (!profile || (profile.role !== 'artist' && profile.role !== 'admin')) return;
            const { data } = await supabase
                .from('releases')
                .select('*')
                .eq('artist_id', profile.id)
                .order('created_at', { ascending: false });

            if (data) setArtistReleases(data);
        };

        fetchFollowStats();
        fetchApplication();
        fetchArtistMusic();
    }, [location.state, profile]);

    const handlePlayTrack = (track: any) => {
        setCurrentTrack(track);
        setQueue(tracks);
        setIsPlaying(true);
    };

    const handleUpdateProfile = async () => {
        if (!profile) return;
        try {
            setUpdating(true);

            // Use RPC to bypass RLS for Telegram users
            const { data, error } = await supabase.rpc('update_telegram_user_profile', {
                p_user_id: profile.id,
                p_full_name: newName
            });

            if (error) throw error;
            if (data) {
                setProfile(data);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setUpdating(false);
        }
    };

    const handleApplyArtist = async (type: 'artist' | 'label') => {
        if (!profile) return;
        try {
            setUpdating(true);

            // Use RPC to bypass RLS issues for non-standard auth
            const { error } = await supabase.rpc('submit_artist_application', {
                p_user_id: profile.id,
                p_type: type
            });

            if (error) {
                // If the error is custom "Pending application already exists", handle it gracefully
                if (error.message.includes('Pending application already exists')) {
                    alert('You already have a pending application.');
                } else {
                    throw error;
                }
            } else {
                setApplicationStatus('pending');
                alert('Application submitted successfully!');
            }
        } catch (err: any) {
            console.error('Error submitting application:', err);
            alert(`Error submitting application: ${err.message || 'Unknown error'}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        try {
            setUpdating(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const avatarUrl = urlData.publicUrl;

            // Use RPC to update avatar URL in profile
            const { data: updatedProfile, error: dbError } = await supabase.rpc('update_telegram_user_profile', {
                p_user_id: profile.id,
                p_avatar_url: avatarUrl
            });

            if (dbError) throw dbError;
            if (updatedProfile) {
                setProfile(updatedProfile);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-white">
                <Loader2 className="animate-spin text-[#1DB954] mb-4" size={32} />
                <p className="text-[#B3B3B3] font-mono text-xs uppercase tracking-widest">{t.syncing_profile}</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-white p-8 text-center">
                <User size={64} className="text-[#B3B3B3] mb-4 opacity-20" />
                <h2 className="text-xl font-bold mb-2">{t.not_found}</h2>
            </div>
        );
    }

    return (
        <div className="flex flex-col text-white pb-20">
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
            <UserListModal
                isOpen={isUserListModalOpen}
                onClose={() => setIsUserListModalOpen(false)}
                userId={profile.id}
                type={userListType}
                title={userListTitle}
            />



            <header className="relative p-6 pt-12 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#1DB954]/10 blur-[100px] rounded-full -z-10" />

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black tracking-tighter uppercase">{t.title}</h1>
                    <button
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <SettingsIcon size={22} className="text-[#B3B3B3]" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative group mb-4">
                        <div className={`w-28 h-28 rounded-full border-4 border-[#121212] shadow-[0_0_50px_rgba(29,185,84,0.15)] overflow-hidden bg-[#282828] relative ${updating ? 'opacity-50' : ''}`}>
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                    <User size={48} />
                                </div>
                            )}

                            <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>

                        {updating && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="animate-spin text-[#1DB954]" size={24} />
                            </div>
                        )}

                        <div className="absolute bottom-1 right-1 w-7 h-7 bg-[#1DB954] rounded-full border-[3px] border-[#121212] flex items-center justify-center shadow-lg">
                            <Check size={14} className="text-black font-bold" strokeWidth={4} />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                    </div>

                    <div className="flex flex-col items-center w-full max-w-[280px]">
                        {isEditing ? (
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-[#282828] border-none text-center h-10 text-lg font-bold focus:ring-[#1DB954]"
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-[#B3B3B3]"
                                        onClick={() => { setIsEditing(false); setNewName(profile.full_name); }}
                                    >
                                        {t.cancel}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-[#1DB954] text-black text-xs font-bold px-4"
                                        onClick={handleUpdateProfile}
                                        disabled={updating}
                                    >
                                        {t.save}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative inline-flex items-center justify-center group mb-2">
                                <h2 className="text-2xl font-black tracking-tight">{profile.full_name}</h2>
                                <button
                                    onClick={() => { setIsEditing(true); setNewName(profile.full_name); }}
                                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded-full"
                                >
                                    <Edit3 size={14} className="text-[#1DB954]" />
                                </button>
                            </div>
                        )}
                        <p className="text-xs font-mono text-[#B3B3B3] bg-white/5 py-1 px-3 rounded-full">
                            @{profile.username || `user_${profile.telegram_id}`}
                        </p>
                    </div>

                    <div className="flex justify-center gap-10 mt-8 w-full border-t border-white/5 pt-8">
                        <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setActiveTab('posts')}>
                            <div className="font-black text-xl leading-none">{postsCount}</div>
                            <div className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-[0.1em] mt-2">Posts</div>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => {
                                setUserListType('following');
                                setUserListTitle(t.following);
                                setIsUserListModalOpen(true);
                            }}
                        >
                            <div className="font-black text-xl leading-none">{followingCount}</div>
                            <div className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-[0.1em] mt-2">{t.following}</div>
                        </div>
                        <div
                            className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => {
                                setUserListType('followers');
                                setUserListTitle(t.followers);
                                setIsUserListModalOpen(true);
                            }}
                        >
                            <div className="font-black text-xl leading-none">{followerCount}</div>
                            <div className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-[0.1em] mt-2">{t.followers}</div>
                        </div>
                    </div>

                    {/* ARTIST/LABEL APPLICATION MODES */}
                    {profile.role !== 'artist' && profile.role !== 'admin' && (
                        <div className="mt-8 w-full px-4">
                            {applicationStatus === 'pending' ? (
                                <div className="bg-[#1DB954]/5 border border-[#1DB954]/20 rounded-2xl p-6 text-center">
                                    <Sparkles className="mx-auto text-[#1DB954] mb-3 animate-pulse" size={32} />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Application Pending</h3>
                                    <p className="text-[10px] text-[#B3B3B3] font-mono">Our admins are currently reviewing your profile.</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[#B3B3B3] mb-4 text-center">Creator Hub</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleApplyArtist('artist')}
                                            disabled={updating}
                                            className="bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 p-4 rounded-2xl flex flex-col items-center gap-2 group transition-all active:scale-95"
                                        >
                                            <ShieldCheck size={24} className="text-[#1DB954]" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-white">Artist Status</span>
                                        </button>
                                        <button
                                            onClick={() => handleApplyArtist('label')}
                                            disabled={updating}
                                            className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 p-4 rounded-2xl flex flex-col items-center gap-2 group transition-all active:scale-95"
                                        >
                                            <Landmark size={24} className="text-blue-500" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter text-white">Label Status</span>
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-[#B3B3B3] text-center mt-4 font-mono uppercase tracking-[0.2em] opacity-40">Apply to upload music & releases</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ARTIST Hub tools (Also for Admins) */}
                    {(profile.role === 'artist' || profile.role === 'admin') && (
                        <div className="mt-8 w-full px-4">
                            <div className="bg-gradient-to-br from-[#1DB954]/20 to-transparent border border-[#1DB954]/20 rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Artist Hub</h3>
                                        <p className="text-[9px] text-[#1DB954] font-mono uppercase tracking-widest mt-1">Status: Verified {profile.artist_type}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black">
                                        <Sparkles size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => navigate('/artist/manage', { state: { openUploadModal: true } })}
                                        className="py-3 px-4 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                        Upload New
                                    </button>
                                    <button
                                        onClick={() => navigate('/artist/manage')}
                                        className="py-3 px-4 bg-white/10 text-white hover:bg-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all"
                                    >
                                        Manage All
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex border-b border-white/10 px-4 mt-4 sticky top-0 bg-[#121212]/80 backdrop-blur-lg z-10">
                {[
                    { id: 'posts', icon: MessageSquare, label: 'Posts' },
                    { id: 'music', icon: Disc, label: 'Music', show: profile.role === 'artist' || profile.role === 'admin' },
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
                        {/* @ts-ignore */}
                        <tab.icon size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 min-h-[40vh]">

                {activeTab === 'music' && (
                    <div className="flex flex-col gap-3">
                        {artistReleases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3] bg-[#181818]/50 rounded-2xl border border-white/5">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Disc size={32} className="opacity-20" />
                                </div>
                                <p className="font-bold text-sm">No releases yet</p>
                                <button
                                    onClick={() => navigate('/artist/manage')}
                                    className="text-[10px] text-[#1DB954] mt-2 uppercase tracking-widest font-black"
                                >
                                    Upload First Release
                                </button>
                            </div>
                        ) : (
                            artistReleases.map((release) => (
                                <div
                                    key={release.id}
                                    className="flex items-center gap-4 bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98]"
                                    onClick={() => navigate(`/release/${release.id}`)}
                                >
                                    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-lg shadow-xl">
                                        <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight mb-1">{release.title}</h4>
                                        <p className="text-[10px] text-[#B3B3B3] truncate font-mono uppercase tracking-widest">{release.genre} • {new Date(release.created_at).getFullYear()}</p>
                                    </div>
                                    <div className="bg-white/10 p-2 rounded-full text-[#B3B3B3] group-hover:text-white transition-colors">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}


                {activeTab === 'posts' && (
                    <PostGrid userId={profile.id} />
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
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{collectionTrackIds.length} items</p>
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
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{likedTrackIds.length} items</p>
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
                                            <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">{useLibraryStore.getState().playlists.length} items</p>
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
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Collection</h3>
                                        {tracks.filter(t => collectionTrackIds.includes(t.id)).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3] bg-[#181818]/50 rounded-2xl border border-white/5">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <Music size={32} className="opacity-20" />
                                                </div>
                                                <p className="font-bold text-sm">{t.collection_empty}</p>
                                                <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider font-mono">{t.go_to_store}</p>
                                            </div>
                                        ) : (
                                            tracks.filter(t => collectionTrackIds.includes(t.id)).map((track) => (
                                                <div
                                                    key={track.id}
                                                    className="flex items-center gap-4 bg-[#181818]/40 p-3 rounded-xl border border-white/5 hover:bg-[#282828]/60 transition-all group cursor-pointer active:scale-[0.98]"
                                                    onClick={() => handlePlayTrack(track)}
                                                >
                                                    <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg shadow-lg bg-[#282828]">
                                                        {track.coverUrl ? (
                                                            <img
                                                                src={track.coverUrl}
                                                                alt={track.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm truncate leading-tight mb-1">{track.title}</h4>
                                                        <p className="text-[11px] text-[#B3B3B3] truncate uppercase tracking-widest font-medium">{track.artistName}</p>
                                                    </div>
                                                    <div className="w-9 h-9 flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all lg:opacity-100">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {collectionsSubTab === 'likes' && (
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Likes (Wishlist)</h3>
                                        {tracks.filter(t => likedTrackIds.includes(t.id)).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3] bg-[#181818]/50 rounded-2xl border border-white/5">
                                                <div className="w-16 h-16 bg-[#1DB954]/5 rounded-full flex items-center justify-center mb-4">
                                                    <Heart size={32} className="text-[#1DB954]/30" />
                                                </div>
                                                <p className="font-bold text-sm">{t.likes_empty}</p>
                                                <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider font-mono">{t.like_tracks_store}</p>
                                            </div>
                                        ) : (
                                            tracks.filter(t => likedTrackIds.includes(t.id)).map((track) => (
                                                <div
                                                    key={track.id}
                                                    className="flex items-center gap-4 bg-[#181818]/40 p-3 rounded-xl border border-white/5 hover:bg-[#282828]/60 transition-all group cursor-pointer active:scale-[0.98]"
                                                    onClick={() => handlePlayTrack(track)}
                                                >
                                                    <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg shadow-lg bg-[#282828]">
                                                        {track.coverUrl ? (
                                                            <img
                                                                src={track.coverUrl}
                                                                alt={track.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-white text-sm truncate leading-tight mb-1">{track.title}</h4>
                                                        <p className="text-[11px] text-[#B3B3B3] truncate uppercase tracking-widest font-medium">{track.artistName}</p>
                                                    </div>
                                                    <div className="w-9 h-9 flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all lg:opacity-100">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {collectionsSubTab === 'playlists' && (
                                    <div className="flex flex-col gap-3">
                                        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Playlists</h3>
                                        {useLibraryStore.getState().playlists.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3] bg-[#181818]/50 rounded-2xl border border-white/5">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                    <ListMusic size={32} className="opacity-20" />
                                                </div>
                                                <p className="font-bold text-sm">No playlists created yet</p>
                                            </div>
                                        ) : (
                                            useLibraryStore.getState().playlists.map(playlist => (
                                                <div
                                                    key={playlist.id}
                                                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                                                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                                                >
                                                    <div className="w-16 h-16 bg-[#282828] rounded-xl overflow-hidden shadow-lg shrink-0 border border-white/10 relative">
                                                        {playlist.cover_url ? (
                                                            <img src={playlist.cover_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                                <ListMusic size={28} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-white truncate text-sm">{playlist.title}</h4>
                                                            {playlist.is_public ? (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] font-black uppercase tracking-widest border border-[#1DB954]/20">Public</span>
                                                            ) : (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-[#B3B3B3] font-black uppercase tracking-widest border border-white/10">Private</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-1">Playlist • {playlist.tracks_count} tracks</p>
                                                    </div>
                                                </div>
                                            ))
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

export default Profile;
