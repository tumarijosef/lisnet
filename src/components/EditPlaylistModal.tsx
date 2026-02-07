import { useState } from 'react';
import { Plus, X, Upload, Loader2, Camera } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';
import { twMerge } from 'tailwind-merge';

interface EditPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: {
        id: string;
        title: string;
        cover_url?: string;
        description?: string;
        is_public?: boolean;
    };
}

const EditPlaylistModal = ({ isOpen, onClose, playlist }: EditPlaylistModalProps) => {
    const { updatePlaylist } = useLibraryStore();
    const [title, setTitle] = useState(playlist.title);
    const [description, setDescription] = useState(playlist.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [coverUrl, setCoverUrl] = useState(playlist.cover_url || '');
    const [isPublic, setIsPublic] = useState(playlist.is_public || false);

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${playlist.id}-${Math.random()}.${fileExt}`;
            const filePath = `playlist-covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('covers')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('covers')
                .getPublicUrl(filePath);

            setCoverUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading cover:', error);
            alert('Error uploading cover');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updatePlaylist(playlist.id, {
            title: title.trim(),
            description: description.trim(),
            cover_url: coverUrl,
            is_public: isPublic
        });
        setIsSaving(false);
        onClose();
        // Force refresh parent if needed, but Zustand should handle it
        window.location.reload();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center">
            <div className="bg-[#181818] w-full max-w-md rounded-t-[32px] sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[92dvh] overflow-y-auto">
                <div className="p-6 pb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Edit Details</h2>
                        <button onClick={onClose} className="text-[#B3B3B3] hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Cover Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer w-40 h-40 bg-[#282828] rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                {coverUrl ? (
                                    <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <Camera size={48} />
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <div className="flex flex-col items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                                        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                                        <span>Change Photo</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadCover} disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Playlist Name</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="My awesome playlist"
                                    className="bg-white/5 border-white/10 text-white focus:ring-[#1DB954]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add an optional description"
                                    className="w-full h-24 p-3 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#1DB954] resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div>
                                    <h4 className="text-xs font-bold text-white uppercase tracking-tight">Public Playlist</h4>
                                    <p className="text-[10px] text-[#B3B3B3] font-mono mt-1">Make this playlist visible to everyone</p>
                                </div>
                                <button
                                    onClick={() => setIsPublic(!isPublic)}
                                    className={twMerge(
                                        "w-12 h-6 rounded-full transition-all relative",
                                        isPublic ? "bg-[#1DB954]" : "bg-[#282828] border border-white/10"
                                    )}
                                >
                                    <div className={twMerge(
                                        "absolute top-1 w-4 h-4 rounded-full transition-all",
                                        isPublic ? "right-1 bg-black" : "left-1 bg-white/20"
                                    )} />
                                </button>
                            </div>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !title.trim() || uploading}
                            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase tracking-tight h-12 rounded-full"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Details'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPlaylistModal;
