
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from "../../components/ui/button";
import { Upload, Loader2, Play, Music } from "lucide-react";

interface TrackUploadFormProps {
    initialData?: any;
    onSuccess: (track: any) => void;
    onCancel: () => void;
}

const TrackUploadForm = ({ initialData, onSuccess, onCancel }: TrackUploadFormProps) => {
    const [loading, setLoading] = useState(false);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        artistName: '',
        genre: 'Electronic',
        price: '0.99',
    });

    // Initialize form with data if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                artistName: initialData.artist_name || '',
                genre: initialData.genre || 'Electronic',
                price: initialData.price?.toString() || '0.99',
            });
        }
    }, [initialData]);

    const uploadFile = async (file: File, bucket: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async () => {
        // Validation changes for Edit Mode: Audio is not required if we already have it (initialData)
        if (!formData.title || !formData.artistName) {
            alert('Title and Artist are required.');
            return;
        }

        // Require audio only for new uploads
        if (!initialData && !audioFile) {
            alert('Please upload an audio file for new releases.');
            return;
        }

        try {
            setLoading(true);

            // 1. Upload Cover (if provided)
            let coverUrl = initialData?.cover_url || '';
            if (coverFile) {
                coverUrl = await uploadFile(coverFile, 'images');
            }

            // 2. Upload Audio (if provided)
            let audioUrl = initialData?.audio_url || '';
            if (audioFile) {
                audioUrl = await uploadFile(audioFile, 'audio-files');
            }

            // Database Operation
            let resultData;

            if (initialData) {
                // UPDATE Existing
                const { data, error } = await supabase
                    .from('tracks')
                    .update({
                        title: formData.title,
                        artist_name: formData.artistName,
                        cover_url: coverUrl,
                        audio_url: audioUrl,
                        price: parseFloat(formData.price),
                        genre: formData.genre,
                    })
                    .eq('id', initialData.id)
                    .select();

                if (error) throw error;
                resultData = data;

            } else {
                // INSERT New
                // const { data: { user } } = await supabase.auth.getUser();
                // Force null for now to avoid FK violation if profile doesn't exist yet
                const artistId = null;

                const { data, error } = await supabase
                    .from('tracks')
                    .insert([
                        {
                            title: formData.title,
                            artist_name: formData.artistName,
                            artist_id: artistId,
                            cover_url: coverUrl,
                            audio_url: audioUrl,
                            price: parseFloat(formData.price),
                            genre: formData.genre,
                            duration: 180, // Mock duration for now
                            is_published: true
                        }
                    ])
                    .select();

                if (error) throw error;
                resultData = data;
            }

            onSuccess(resultData ? resultData[0] : null);

            // Clear form if not closing (though usually we close modal)
            if (!initialData) {
                setFormData({
                    title: '',
                    artistName: '',
                    genre: 'Electronic',
                    price: '0.99'
                });
                setAudioFile(null);
                setCoverFile(null);
            }

        } catch (error: any) {
            console.error('Error saving track:', error);
            alert('Operation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#282828] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                    placeholder="Track Title"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Artist Name</label>
                <input
                    type="text"
                    value={formData.artistName}
                    onChange={e => setFormData({ ...formData, artistName: e.target.value })}
                    className="w-full bg-[#282828] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                    placeholder="Artist Name"
                />
            </div>

            {/* File Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Cover Image</label>
                    <div
                        className="h-24 bg-[#282828] rounded border border-dashed border-[#B3B3B3] flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors relative overflow-hidden"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {coverFile ? (
                            <div className="text-center p-2 z-10">
                                <span className="text-[10px] text-green-500 block truncate max-w-[100px]">{coverFile.name}</span>
                                <span className="text-[9px] text-[#B3B3B3]">(Click to change)</span>
                            </div>
                        ) : initialData?.cover_url ? (
                            <div className="w-full h-full relative group">
                                <img src={initialData.cover_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold drop-shadow-md">Change Image</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Upload size={16} className="text-[#B3B3B3] mb-1" />
                                <span className="text-[10px] text-[#B3B3B3]">Upload Image</span>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Audio File (MP3)</label>
                    <div
                        className="h-24 bg-[#282828] rounded border border-dashed border-[#B3B3B3] flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors"
                        onClick={() => audioInputRef.current?.click()}
                    >
                        {audioFile ? (
                            <div className="text-center p-2">
                                <span className="text-[10px] text-green-500 block truncate max-w-[100px]">{audioFile.name}</span>
                                <span className="text-[9px] text-[#B3B3B3]">(Click to change)</span>
                            </div>
                        ) : initialData?.audio_url ? (
                            <div className="flex flex-col items-center justify-center">
                                <Music size={16} className="text-[#1DB954] mb-1" />
                                <span className="text-[10px] text-[#1DB954]">File Uploaded</span>
                                <span className="text-[9px] text-[#B3B3B3]">Click to replace</span>
                            </div>
                        ) : (
                            <>
                                <Play size={16} className="text-[#B3B3B3] mb-1" />
                                <span className="text-[10px] text-[#B3B3B3]">Upload MP3</span>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={audioInputRef}
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Genre</label>
                    <input
                        type="text"
                        value={formData.genre}
                        onChange={e => setFormData({ ...formData, genre: e.target.value })}
                        className="w-full bg-[#282828] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#B3B3B3] mb-1">Price ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-[#282828] text-white rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={onCancel} className="text-white hover:bg-white/10" disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-bold" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {initialData ? 'Updating...' : 'Uploading...'}
                        </>
                    ) : (
                        initialData ? 'Update Release' : 'Publish Release'
                    )}
                </Button>
            </div>
        </div>
    );
};

export default TrackUploadForm;
