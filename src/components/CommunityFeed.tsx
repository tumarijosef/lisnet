import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const CommunityFeed = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, user:profiles(full_name, avatar_url, username, role)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleLikeToggle = (postId: string) => {
        // Stats are handled within PostCard, but we could update state here if needed
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-[10px] uppercase font-black tracking-widest">Encrypting Feed...</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center opacity-20 border border-white/5 rounded-[2rem] bg-white/[0.02] text-white">
                <p className="font-black uppercase tracking-widest text-xs">No community activity yet</p>
                <p className="text-[10px] mt-2 font-mono">Be the first to post something</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
            ))}
        </div>
    );
};

export default CommunityFeed;
