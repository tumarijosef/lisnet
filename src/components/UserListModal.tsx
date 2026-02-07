import { useState, useEffect } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface UserItem {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
    title: string;
}

const UserListModal = ({ isOpen, onClose, userId, type, title }: UserListModalProps) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUsers();
        }
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Determine which column to match and which to join
            const matchColumn = type === 'followers' ? 'following_id' : 'follower_id';
            const selectColumn = type === 'followers' ? 'follower_id' : 'following_id';

            const { data, error } = await supabase
                .from('follows')
                .select(`
                    profiles:${selectColumn} (
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .eq(matchColumn, userId);

            if (error) throw error;

            if (data) {
                const formattedUsers = data.map((item: any) => item.profiles).filter(Boolean);
                setUsers(formattedUsers);
            }
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (targetUserId: string) => {
        onClose();
        navigate(`/profile/${targetUserId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#181818] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">{title}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-[#B3B3B3]">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto no-scrollbar flex flex-col gap-2">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-[#1DB954]" size={24} />
                            </div>
                        ) : users.length > 0 ? (
                            users.map((u) => (
                                <div
                                    key={u.id}
                                    onClick={() => handleUserClick(u.id)}
                                    className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all group active:scale-[0.98]"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#282828]">
                                        {u.avatar_url ? (
                                            <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                <User size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate text-sm">{u.full_name || u.username}</h4>
                                        <p className="text-[10px] text-[#B3B3B3] font-black uppercase tracking-widest mt-0.5 mt-1">@{u.username}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-[#B3B3B3] opacity-20 text-center">
                                <User size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No users found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
