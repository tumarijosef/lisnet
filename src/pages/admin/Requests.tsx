import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { supabase } from "../../lib/supabase";
import { Check, X, User, Loader2, ShieldCheck, Landmark } from "lucide-react";
import { Button } from "../../components/ui/button";

interface Application {
    id: string;
    type: 'artist' | 'label';
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    created_at: string;
    user: {
        id: string;
        full_name: string;
        avatar_url: string;
        username: string;
    };
}

import { useAuthStore } from "../../store/useAuthStore";

const Requests = () => {
    const { profile } = useAuthStore();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        // Use RPC to fetch requests securely bypassing RLS
        const { data, error } = await supabase.rpc('get_admin_requests');

        if (error) {
            console.error('Error fetching requests:', error);
        } else if (data) {
            // Transform data to match Application interface
            const formattedData = data.map((item: any) => ({
                id: item.id,
                type: item.type,
                status: item.status,
                created_at: item.created_at,
                message: '',
                user: {
                    id: item.user_id, // Map user_id from RPC query to nested user.id
                    full_name: item.full_name,
                    avatar_url: item.avatar_url,
                    username: item.username
                }
            }));
            setApplications(formattedData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApplications();
    }, []);



    // ... existing code ...

    const handleAction = async (requestId: string, userId: string, type: 'artist' | 'label', action: 'approved' | 'rejected') => {
        try {
            setProcessingId(requestId);

            // Use RPC to process application (update status, update profile, send notification)
            const { error } = await supabase.rpc('process_artist_application', {
                p_application_id: requestId,
                p_status: action,
                p_user_id: userId,
                // If profile.id is undefined (no profile loaded), pass explicit null or userId to avoid FK error
                p_admin_id: profile?.id || null
            });

            if (error) {
                console.error("RPC Error:", error);
                throw new Error(error.message || "Unknown RPC error");
            }

            // Refresh list
            setApplications(prev => prev.filter(app => app.id !== requestId));
        } catch (err) {
            console.error('Error processing application:', err);
            alert('Failed to process application');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tighter text-white">Artist Applications</h2>
                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">
                    {applications.length} Pending
                </span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3]">
                    <Loader2 className="animate-spin text-[#1DB954] mb-4" size={32} />
                    <p className="font-mono text-xs uppercase tracking-widest">Loading requests...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-[#181818] border border-white/10 rounded-3xl p-20 text-center">
                    <Check className="mx-auto text-[#1DB954]/20 mb-4" size={48} />
                    <h3 className="text-white font-bold text-lg">All caught up!</h3>
                    <p className="text-[#B3B3B3] text-sm">No pending applications at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {applications.map((app) => (
                        <Card key={app.id} className="bg-[#181818] border-white/10 overflow-hidden relative group">
                            <div className="absolute top-3 right-3">
                                {app.type === 'artist' ? (
                                    <ShieldCheck size={18} className="text-[#1DB954] opacity-50" />
                                ) : (
                                    <Landmark size={18} className="text-blue-500 opacity-50" />
                                )}
                            </div>

                            <CardHeader className="flex flex-row items-center gap-4 pb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#282828] border border-white/5">
                                    {app.user.avatar_url ? (
                                        <img src={app.user.avatar_url} className="w-full h-full object-cover" alt={app.user.full_name} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-white truncate max-w-[150px] uppercase tracking-tight">
                                        {app.user.full_name}
                                    </CardTitle>
                                    <p className="text-[10px] text-[#B3B3B3] font-mono">@{app.user.username}</p>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Requested Status</p>
                                        <span className={app.type === 'artist' ? "text-[#1DB954] text-xs font-bold" : "text-blue-500 text-xs font-bold"}>
                                            {app.type.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Request Date</p>
                                        <div className="text-[10px] text-white/60 font-mono leading-tight">
                                            {new Date(app.created_at).toLocaleDateString()}<br />
                                            {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAction(app.id, app.user.id, app.type, 'approved')}
                                        disabled={!!processingId}
                                        className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-[10px] uppercase h-9 rounded-lg"
                                    >
                                        {processingId === app.id ? <Loader2 className="animate-spin" size={14} /> : "Approve"}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(app.id, app.user.id, app.type, 'rejected')}
                                        disabled={!!processingId}
                                        variant="ghost"
                                        className="flex-1 bg-white/5 hover:bg-red-500 hover:text-white text-white font-black text-[10px] uppercase h-9 rounded-lg border border-white/5"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Requests;
