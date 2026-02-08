import { useState, useEffect } from 'react';
import { X, UserPlus, Bell, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

interface Notification {
    id: string;
    type: string;
    actor_id: string;
    created_at: string;
    is_read: boolean;
    data: any;
}

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && profile) {
            fetchNotifications();
            markAsRead();
        }
    }, [isOpen, profile]);

    const fetchNotifications = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        if (!profile) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        onClose();
        if (notification.type === 'follow') {
            navigate(`/profile/${notification.actor_id}`);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#121212] rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

                {/* Drag Indicator for Mobile */}
                <div className="w-full h-1.5 flex justify-center py-3 sm:hidden">
                    <div className="w-12 h-1 bg-white/20 rounded-full" />
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-white">
                            <Bell size={20} className="text-[#1DB954]" />
                            <h2 className="text-lg font-black uppercase tracking-tighter">Notifications</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-[#B3B3B3] transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto no-scrollbar flex flex-col gap-2 pb-8 sm:pb-4">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-[#1DB954]" size={24} />
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${!n.is_read ? 'bg-white/[0.05] border border-[#1DB954]/20' : 'bg-white/[0.02] border border-white/5'
                                        } hover:bg-white/10`}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                                        {n.data?.follower_avatar ? (
                                            <img src={n.data.follower_avatar} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-[#282828] flex items-center justify-center text-white/20">
                                                <UserPlus size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white leading-tight">
                                            <span className="font-black">{n.data?.follower_name}</span> started following you
                                        </p>
                                        <p className="text-[10px] text-[#B3B3B3] uppercase font-bold tracking-widest mt-1">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!n.is_read && <div className="w-2 h-2 bg-[#1DB954] rounded-full shadow-[0_0_10px_#1DB954]"></div>}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-[#B3B3B3] opacity-20">
                                <Bell size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default NotificationsModal;
