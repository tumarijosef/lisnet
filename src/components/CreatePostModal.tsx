import { useState, useRef, useCallback } from 'react';
import { X, Camera, Loader2, Send, Check, Scissors } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreatePostModal = ({ isOpen, onClose, onSuccess }: CreatePostModalProps) => {
    const { profile } = useAuthStore();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | Blob | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCropping, setIsCropping] = useState(false);

    // Cropper State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage(reader.result as string);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_croppedArea: any, pixelArea: any) => {
        setCroppedAreaPixels(pixelArea);
    }, []);

    const handleApplyCrop = async () => {
        if (!originalImage || !croppedAreaPixels) return;
        try {
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(originalImage, croppedAreaPixels);
            if (croppedImageBlob) {
                setImage(croppedImageBlob);
                setImagePreview(URL.createObjectURL(croppedImageBlob));
                setIsCropping(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!profile || (!content.trim() && !image)) return;

        try {
            setLoading(true);
            let imageUrl = '';

            if (image) {
                const fileName = `${profile.id}-${Math.random().toString(36).substring(7)}.jpg`;
                const filePath = `posts/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, image, {
                        contentType: 'image/jpeg'
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
                imageUrl = urlData.publicUrl;
            }

            const { error } = await supabase.from('posts').insert({
                user_id: profile.id,
                content: content.trim(),
                image_url: imageUrl
            });

            if (error) throw error;

            setContent('');
            setImage(null);
            setImagePreview(null);
            setOriginalImage(null);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#181818] w-full max-w-lg rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                {isCropping ? (
                    <div className="flex flex-col h-[80vh] max-h-[700px]">
                        <div className="p-6 flex items-center justify-between border-b border-white/5">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Crop Photo</h3>
                            <button onClick={() => setIsCropping(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#B3B3B3]">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 relative bg-black/40">
                            <Cropper
                                image={originalImage || ''}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                showGrid={false}
                                cropShape="rect"
                            />
                        </div>
                        <div className="p-6 bg-[#181818] border-t border-white/5 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Zoom</span>
                                    <span className="text-[10px] font-mono text-[#1DB954]">{zoom.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#1DB954]"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-[#B3B3B3] font-bold uppercase tracking-widest text-[10px] h-12"
                                    onClick={() => setIsCropping(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-2 bg-[#1DB954] text-black hover:bg-[#1ed760] font-black uppercase tracking-widest text-[10px] rounded-full h-12 shadow-lg shadow-[#1DB954]/20"
                                    onClick={handleApplyCrop}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Check size={16} className="mr-2" /> Save Changes</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className="p-6 flex items-center justify-between border-b border-white/5"
                            onClick={(e) => {
                                // Dismiss keyboard when clicking header
                                if ((document.activeElement as HTMLElement)?.blur) {
                                    (document.activeElement as HTMLElement).blur();
                                }
                            }}
                        >
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">New Post</h3>
                            <div className="flex items-center gap-2">
                                {/* Only show Done button when textarea is focused on mobile */}
                                <button
                                    onClick={() => (document.activeElement as HTMLElement)?.blur()}
                                    className="px-3 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1DB954] active:scale-90 transition-all sm:hidden"
                                >
                                    Done
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#B3B3B3]">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 resize-none h-32 font-medium text-lg"
                                enterKeyHint="done"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        (e.target as HTMLTextAreaElement).blur();
                                    }
                                }}
                            />

                            {imagePreview ? (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 group aspect-square max-w-[300px] mx-auto">
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setIsCropping(true)}
                                            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                                        >
                                            <Scissors size={20} />
                                        </button>
                                        <button
                                            onClick={() => { setImage(null); setImagePreview(null); }}
                                            className="p-3 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-red-500 transition-all transform hover:scale-110"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/5 hover:border-[#1DB954]/50 hover:bg-[#1DB954]/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#B3B3B3] group-hover:text-[#1DB954] group-hover:bg-[#1DB954]/10 transition-all">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3] group-hover:text-white">Add Photo</span>
                                </button>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="p-6 bg-white/[0.02] flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                className="text-[#B3B3B3] font-bold uppercase tracking-widest text-[10px]"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-black uppercase tracking-widest text-[10px] px-8 rounded-full h-11 shadow-lg shadow-[#1DB954]/20"
                                onClick={handleCreatePost}
                                disabled={loading || (!content.trim() && !image)}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} className="mr-2" /> Post</>}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreatePostModal;

