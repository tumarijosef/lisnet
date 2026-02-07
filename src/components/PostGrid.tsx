import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Image, MessageSquare, Heart } from 'lucide-react';

interface PostGridProps {
    userId: string;
}

const PostGrid = ({ userId }: PostGridProps) => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserPosts = async () => {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                console.error('Error fetching user posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserPosts();
    }, [userId]);

    if (loading) {
        return (
            <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-sm" />
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 border border-white/5 rounded-3xl bg-white/[0.02] text-white">
                <Image size={48} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No posts yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {posts.map((post: any) => (
                <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="relative aspect-square group cursor-pointer bg-[#1e1e1e] overflow-hidden"
                >
                    {post.image_url ? (
                        <img src={post.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-white/5 to-transparent">
                            <p className="text-[10px] text-white/40 line-clamp-4 font-bold uppercase tracking-tighter text-center">
                                {post.content}
                            </p>
                        </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1 text-white text-xs font-black">
                            <Heart size={16} fill="white" />
                            <span>...</span>
                        </div>
                        <div className="flex items-center gap-1 text-white text-xs font-black">
                            <MessageSquare size={16} fill="white" />
                            <span>...</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PostGrid;
