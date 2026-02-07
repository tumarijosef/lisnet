import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';
import { ChevronLeft, Loader2 } from 'lucide-react';

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, user:profiles(id, full_name, avatar_url, username)')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setPost(data);
            } catch (err) {
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const handleLikeToggle = () => {
        // Stats in the feed could be updated, but here we just need to keep consistency
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-[#1DB954]" size={32} />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#121212] p-4 flex flex-col items-center justify-center text-white/40">
                <p className="font-black uppercase tracking-widest text-lg mb-4">Post not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    <ChevronLeft size={16} />
                    Back to Feed
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] p-4 pb-32">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Nav */}
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Post Details</h1>
                </div>

                {/* Post Card */}
                <PostCard post={post} onLikeToggle={handleLikeToggle} />
            </div>
        </div>
    );
};

export default PostDetails;
