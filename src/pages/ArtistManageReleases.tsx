import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Edit2, Trash2, Plus, Loader2, Disc, ChevronDown, ChevronRight, User, X, ArrowLeft } from "lucide-react";
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import ReleaseUploadForm from './admin/ReleaseUploadForm';
import { useNavigate, useLocation } from 'react-router-dom';

// Release Interface
interface Release {
    id: string;
    title: string;
    artist_name: string;
    cover_url?: string;
    price: number;
    genre?: string;
    description?: string;
    created_at: string;
    tracks?: Track[];
}

interface Track {
    id: string;
    title: string;
    artist_name?: string;
    duration: number;
    audio_url: string;
    position: number;
}

const ArtistManageReleases = () => {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRelease, setEditingRelease] = useState<Release | null>(null);
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);
    const location = useLocation();

    // Check for navigation state to open modal automatically
    useEffect(() => {
        if (location.state && (location.state as any).openUploadModal) {
            setIsModalOpen(true);
            // Clear the state so it doesn't reopen on refresh if we were to persist state, 
            // but react-router state is effectively cleared on new navigation. 
            // Actually, to be safe, we can replace the history state, but for now this is fine.
        }
    }, [location]);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    // Fetch Artist Releases
    const fetchReleases = async () => {
        if (!profile) return;
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('releases')
                .select(`
                    *,
                    tracks (
                        id, title, artist_name, duration, audio_url, position
                    )
                `)
                .eq('artist_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedData = data?.map((rel: any) => ({
                ...rel,
                tracks: rel.tracks?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            }));

            setReleases(formattedData || []);
        } catch (error) {
            console.error('Error fetching artist releases:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReleases();
    }, [profile]);

    const handleDelete = async (release: Release) => {
        if (!confirm(`Are you sure you want to delete "${release.title}"? This will remove all associated tracks.`)) return;

        try {
            // 1. Delete Cover Image
            if (release.cover_url) {
                const urlParts = release.cover_url.split('/images/');
                if (urlParts.length > 1) {
                    await supabase.storage.from('images').remove([urlParts[1]]);
                }
            }

            // 2. Delete Audio Files
            if (release.tracks && release.tracks.length > 0) {
                const pathsToDelete = release.tracks
                    .map(t => {
                        const parts = t.audio_url.split('/audio-files/');
                        return parts.length > 1 ? parts[1] : null;
                    })
                    .filter(Boolean) as string[];

                if (pathsToDelete.length > 0) {
                    await supabase.storage.from('audio-files').remove(pathsToDelete);
                }
            }

            const { error } = await supabase.from('releases').delete().eq('id', release.id);
            if (error) throw error;

            setReleases(releases.filter(r => r.id !== release.id));
        } catch (error: any) {
            console.error('Error deleting release:', error);
            alert('Failed to delete: ' + error.message);
        }
    };

    const handleEdit = (release: Release) => {
        setEditingRelease(release);
        setIsModalOpen(true);
    };

    const handleUploadSuccess = () => {
        fetchReleases();
        setIsModalOpen(false);
        setEditingRelease(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRelease(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedReleaseId(expandedReleaseId === id ? null : id);
    };

    if (!profile || profile.role !== 'artist') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <p className="text-[#B3B3B3] mb-4">You do not have permission to access this page.</p>
                <Button onClick={() => navigate('/profile')} className="bg-white text-black">Back to Profile</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-48">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/profile')} className="text-[#B3B3B3] hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">Manage Music</h1>
                        <p className="text-[10px] text-[#1DB954] font-mono uppercase tracking-[0.2em]">{profile.artist_type} Dashboard</p>
                    </div>
                </div>
                <Button onClick={() => { setEditingRelease(null); setIsModalOpen(true); }} className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-black text-[10px] uppercase tracking-widest px-4 h-9 rounded-full">
                    <Plus className="mr-2 h-4 w-4" /> New Release
                </Button>
            </header>

            <div className="p-4 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#B3B3B3]">
                        <Loader2 className="animate-spin text-[#1DB954] mb-4" size={32} />
                        <p className="font-mono text-[10px] uppercase tracking-widest">Loading your library...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {releases.length === 0 ? (
                            <div className="bg-[#181818] border border-white/10 rounded-3xl p-16 text-center">
                                <Disc className="mx-auto text-[#1DB954]/20 mb-4" size={48} />
                                <h3 className="text-white font-bold text-lg">No releases yet</h3>
                                <p className="text-[#B3B3B3] text-sm mb-6">Upload your first album or single to start building your profile.</p>
                                <Button onClick={() => setIsModalOpen(true)} className="bg-white text-black font-black uppercase text-xs tracking-widest rounded-full px-8">
                                    Upload Music
                                </Button>
                            </div>
                        ) : (
                            releases.map((release) => (
                                <div key={release.id} className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden">
                                    <div
                                        className="p-4 flex gap-4 cursor-pointer active:bg-white/5 transition-colors"
                                        onClick={() => toggleExpand(release.id)}
                                    >
                                        <div className="w-16 h-16 rounded-md bg-[#282828] overflow-hidden shrink-0 border border-white/5 shadow-lg">
                                            {release.cover_url ? (
                                                <img src={release.cover_url} className="w-full h-full object-cover" alt={release.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                                    <Disc size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-white font-black truncate text-sm uppercase tracking-tight">{release.title}</h3>
                                            <p className="text-[10px] text-[#B3B3B3] font-mono mt-0.5">{release.genre} • {release.tracks?.length || 0} Tracks</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="outline" className="text-[8px] font-mono border-white/10 text-green-500">${release.price}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-between items-end gap-2">
                                            {expandedReleaseId === release.id ? <ChevronDown size={18} className="text-[#1DB954]" /> : <ChevronRight size={18} className="text-[#B3B3B3]" />}
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEdit(release)}
                                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#B3B3B3] hover:text-white"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(release)}
                                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#B3B3B3] hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Tracks */}
                                    {expandedReleaseId === release.id && (
                                        <div className="bg-black/40 border-t border-white/5 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <h4 className="text-[8px] font-black text-[#535353] uppercase tracking-[0.3em] mb-2">Tracklist</h4>
                                            {release.tracks?.map((track, idx) => (
                                                <div key={track.id} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                                                    <span className="text-[9px] font-mono text-[#535353] w-4">{idx + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-[#B3B3B3] truncate font-medium">{track.title}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black z-[500] overflow-y-auto">
                    <div className="p-6 pb-40">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {editingRelease ? 'Edit Release' : 'New Release'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-[#B3B3B3] hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <ReleaseUploadForm
                            initialData={editingRelease || undefined}
                            artistId={profile.id}
                            onSuccess={handleUploadSuccess}
                            onCancel={handleCloseModal}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistManageReleases;
