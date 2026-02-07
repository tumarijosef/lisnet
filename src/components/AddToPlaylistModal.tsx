import { useState } from 'react';
import { Plus, Music, ListMusic, Check, Loader2 } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    trackId: string;
}

const AddToPlaylistModal = ({ isOpen, onClose, trackId }: AddToPlaylistModalProps) => {
    const { profile } = useAuthStore();
    const { playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
    const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [addingToId, setAddingToId] = useState<string | null>(null);

    const handleCreateAndAdd = async () => {
        if (!profile || !newPlaylistTitle.trim()) return;
        setIsCreating(true);
        const playlistId = await createPlaylist(profile.id, newPlaylistTitle.trim());
        if (playlistId) {
            await addTrackToPlaylist(playlistId, trackId);
            setNewPlaylistTitle('');
            onClose();
        }
        setIsCreating(false);
    };

    const handleAddToExisting = async (playlistId: string) => {
        setAddingToId(playlistId);
        await addTrackToPlaylist(playlistId, trackId);
        setAddingToId(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-[#181818] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Add to Playlist</h2>
                        <button onClick={onClose} className="text-[#B3B3B3] hover:text-white transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-8">
                        <Input
                            placeholder="New playlist name..."
                            value={newPlaylistTitle}
                            onChange={(e) => setNewPlaylistTitle(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-[#1DB954]"
                        />
                        <Button
                            onClick={handleCreateAndAdd}
                            disabled={isCreating || !newPlaylistTitle.trim()}
                            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black uppercase tracking-tight"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create'}
                        </Button>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3] mb-4">Your Playlists</p>
                        <div className="flex flex-col gap-2">
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => handleAddToExisting(playlist.id)}
                                    disabled={addingToId === playlist.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group text-left w-full"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-[#B3B3B3] group-hover:text-[#1DB954] transition-colors">
                                        <ListMusic size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{playlist.title}</p>
                                        <p className="text-[10px] text-[#B3B3B3] uppercase tracking-widest">{playlist.tracks_count} tracks</p>
                                    </div>
                                    {addingToId === playlist.id && <Loader2 className="animate-spin text-[#1DB954]" size={18} />}
                                </button>
                            ))}
                            {playlists.length === 0 && (
                                <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                                    <p className="text-sm text-[#B3B3B3] font-medium tracking-tight">No playlists yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
