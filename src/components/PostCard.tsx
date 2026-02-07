import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Share2, MoreHorizontal, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
    post: any;
    onLikeToggle: (postId: string) => void;
}

const PostCard = ({ post, onLikeToggle }: PostCardProps) => {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);
    const [isCommenting, setIsCommenting] = useState(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    const navigateToProfile = (userId: string) => {
        if (!userId) return;
        // If it's me, go to my profile
        if (profile && profile.id === userId) {
            navigate('/profile', { state: { activeTab: 'posts' } });
        } else {
            navigate(`/profile/${userId}`, { state: { activeTab: 'posts' } });
        }
    };

    useEffect(() => {
        const fetchPostStats = async () => {
            const [likes, counts, comms] = await Promise.all([
                profile ? supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('user_id', profile.id) : { count: 0 },
                supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
                supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id)
            ]);

            setIsLiked(likes.count ? likes.count > 0 : false);
            setLikeCount(counts.count || 0);
            setCommentCount(comms.count || 0);
        };

        fetchPostStats();
    }, [post.id, profile]);

    const handleLike = async () => {
        if (!profile) return;

        try {
            if (isLiked) {
                await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', profile.id);
                setLikeCount((prev: number) => prev - 1);
            } else {
                await supabase.from('post_likes').insert({ post_id: post.id, user_id: profile.id });
                setLikeCount((prev: number) => prev + 1);
            }
            setIsLiked(!isLiked);
            onLikeToggle(post.id);
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        const { data } = await supabase
            .from('post_comments')
            .select('*, user:profiles(id, full_name, avatar_url, username)')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

        setComments(data || []);
        setLoadingComments(false);
    };

    const handleComment = async () => {
        if (!profile || !comment.trim()) return;

        try {
            const { error } = await supabase.from('post_comments').insert({
                post_id: post.id,
                user_id: profile.id,
                content: comment.trim()
            });

            if (error) throw error;
            setComment('');
            setCommentCount((prev: number) => prev + 1);
            fetchComments();
        } catch (err) {
            console.error('Error commenting:', err);
        }
    };

    return (
        <article className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full border border-[#1DB954]/20 p-0.5 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => navigateToProfile(post.user_id)}
                    >
                        <img
                            src={post.user?.avatar_url || `https://ui-avatars.com/api/?name=${post.user?.username}&background=random`}
                            className="w-full h-full object-cover rounded-full"
                            alt=""
                        />
                    </div>
                    <div
                        className="cursor-pointer"
                        onClick={() => navigateToProfile(post.user_id)}
                    >
                        <h4 className="font-bold text-white text-sm leading-none mb-1 uppercase tracking-tight hover:text-[#1DB954] transition-colors">{post.user?.full_name}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#1DB954] font-bold">@{post.user?.username}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">
                                {formatDistanceToNow(new Date(post.created_at))} ago
                            </span>
                        </div>
                    </div>
                </div>
                <button className="text-white/20 hover:text-white p-2 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                {post.content && (
                    <p className="text-sm text-white/80 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                )}

                {post.image_url && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-black/20">
                        <img src={post.image_url} alt="Post" className="w-full h-auto max-h-[400px] object-cover" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex items-center gap-6">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-all active:scale-125 ${isLiked ? 'text-[#1DB954]' : 'text-white/40 hover:text-white'}`}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
                    <span className="text-xs font-black">{likeCount}</span>
                </button>
                <button
                    onClick={() => {
                        setIsCommenting(!isCommenting);
                        if (!isCommenting) fetchComments();
                    }}
                    className={`flex items-center gap-2 transition-all ${isCommenting ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                >
                    <MessageSquare size={20} strokeWidth={2.5} />
                    <span className="text-xs font-black">{commentCount}</span>
                </button>
                <button className="text-white/40 hover:text-white ml-auto transition-colors">
                    <Share2 size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Comments Section */}
            {isCommenting && (
                <div className="bg-black/20 border-t border-white/5 p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                        {loadingComments ? (
                            <p className="text-[10px] text-center text-white/20 uppercase font-black tracking-widest py-4">Loading comments...</p>
                        ) : comments.length === 0 ? (
                            <p className="text-[10px] text-center text-white/20 uppercase font-black tracking-widest py-4">No comments yet</p>
                        ) : (
                            comments.map((c: any) => (
                                <div key={c.id} className="flex gap-3">
                                    <div
                                        className="w-6 h-6 rounded-full border border-white/10 shrink-0 cursor-pointer active:scale-90 transition-transform"
                                        onClick={() => navigateToProfile(c.user_id)}
                                    >
                                        <img src={c.user?.avatar_url || `https://ui-avatars.com/api/?name=${c.user?.username}&background=random`} className="w-full h-full object-cover rounded-full" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span
                                                className="text-[10px] font-bold text-white uppercase tracking-tight cursor-pointer hover:text-[#1DB954] transition-colors"
                                                onClick={() => navigateToProfile(c.user_id)}
                                            >
                                                {c.user?.full_name}
                                            </span>
                                            <span className="text-[8px] text-white/20 font-mono">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                                        </div>
                                        <p className="text-xs text-white/60 leading-tight">{c.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 rounded-full pl-4 pr-1 py-1 border border-white/10 focus-within:border-[#1DB954]/50 transition-colors">
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            className="bg-transparent border-none focus:ring-0 text-xs text-white flex-1 placeholder-white/20"
                        />
                        <button
                            onClick={handleComment}
                            disabled={!comment.trim()}
                            className="bg-[#1DB954] text-black w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            <Send size={14} fill="currentColor" />
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
};

export default PostCard;

const Send = ({ size, fill, className }: { size: number, fill?: string, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill || "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
    </svg>
);
