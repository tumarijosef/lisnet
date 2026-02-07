import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Upload, Loader2, Music, X, FileAudio, User } from "lucide-react";
import UserSearchSelect from "../../components/UserSearchSelect";
import { Profile } from "../../types";

interface Track {
    id: string;
    title: string;
    artist_name?: string;
    duration: number;
    audio_url: string;
    position: number;
    track_artists?: { artist: Profile }[]; // From DB join
    tagged_artists?: Profile[]; // For local state
}

interface ReleaseUploadFormProps {
    initialData?: {
        id: string;
        title: string;
        artist_name: string;
        description?: string;
        genre?: string;
        price: number;
        cover_url?: string;
        artist_id?: string;
        tracks?: Track[];
    };
    artistId?: string;
    isAdmin?: boolean;
    mainArtist?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        username?: string;
    };
    onSuccess: (release: any) => void;
    onCancel: () => void;
}

interface NewTrack {
    file: File;
    title: string;
    artist_name: string;
    tagged_artists?: Profile[];
}

const ReleaseUploadForm = ({ initialData, artistId, isAdmin: propIsAdmin = false, mainArtist, onSuccess, onCancel }: ReleaseUploadFormProps) => {
    const { profile } = useAuthStore();
    const isAdmin = propIsAdmin || profile?.role === 'admin';

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');

    // Release Metadata
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        artistName: initialData?.artist_name || (artistId === profile?.id ? profile?.full_name : '') || '',
        description: initialData?.description || '',
        genre: initialData?.genre || 'Electronic',
        price: initialData?.price?.toString() || '0.99',
    });

    // Existing Tracks (for editing)
    const [existingTracks, setExistingTracks] = useState<Track[]>([]);
    const [tracksToDelete, setTracksToDelete] = useState<string[]>([]);

    // New Files
    const coverInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    // Store objects with file, title AND artist name
    const [newTracks, setNewTracks] = useState<NewTrack[]>([]);

    // Preview for existing cover
    const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_url || null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                artistName: initialData.artist_name,
                description: initialData.description || '',
                genre: initialData.genre || 'Electronic',
                price: initialData.price.toString(),
            });

            // Map initial tracks to include tagged_artists from DB structure
            const mappedTracks = (initialData.tracks || []).map(t => ({
                ...t,
                tagged_artists: t.track_artists?.map((ta: any) => ta.artist) || []
            }));
            setExistingTracks(JSON.parse(JSON.stringify(mappedTracks)));
            setCoverPreview(initialData.cover_url || null);
        }
    }, [initialData]);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const addedTracks = Array.from(e.target.files).map(file => ({
                file,
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist_name: formData.artistName, // Default to release artist
                tagged_artists: []
            }));
            setNewTracks(prev => [...prev, ...addedTracks]);
        }
        if (audioInputRef.current) audioInputRef.current.value = '';
    };

    const removeNewTrack = (index: number) => {
        setNewTracks(tracks => tracks.filter((_, i) => i !== index));
    };

    const handleAddArtistToNewTrack = (index: number, artist: Profile) => {
        setNewTracks(tracks => tracks.map((t, i) => {
            if (i !== index) return t;
            const current = t.tagged_artists || [];
            if (current.some(a => a.id === artist.id)) return t;
            return { ...t, tagged_artists: [...current, artist] };
        }));
    };

    const handleRemoveArtistFromNewTrack = (index: number, artistId: string) => {
        setNewTracks(tracks => tracks.map((t, i) => {
            if (i !== index) return t;
            return { ...t, tagged_artists: (t.tagged_artists || []).filter(a => a.id !== artistId) };
        }));
    };

    const handleUpdateNewTrack = (index: number, updates: Partial<NewTrack>) => {
        setNewTracks(tracks => tracks.map((t, i) => i === index ? { ...t, ...updates } : t));
    };

    const handleRemoveExistingTrack = (trackId: string) => {
        setExistingTracks(prev => prev.filter(t => t.id !== trackId));
        setTracksToDelete(prev => [...prev, trackId]);
    };

    const handleUpdateExistingTrack = (id: string, updates: Partial<Track>) => {
        setExistingTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleAddArtistToExistingTrack = (id: string, artist: Profile) => {
        setExistingTracks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const current = t.tagged_artists || [];
            if (current.some(a => a.id === artist.id)) return t;
            return { ...t, tagged_artists: [...current, artist] };
        }));
    };

    const handleRemoveArtistFromExistingTrack = (trackId: string, artistId: string) => {
        setExistingTracks(prev => prev.map(t => {
            if (t.id !== trackId) return t;
            return { ...t, tagged_artists: (t.tagged_artists || []).filter(a => a.id !== artistId) };
        }));
    };

    const uploadFile = async (file: File, bucket: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.artistName) {
            alert('Пожалуйста, заполните название и имя артиста.');
            return;
        }

        if (!initialData && (!coverFile || newTracks.length === 0)) {
            alert('Для нового релиза нужно загрузить обложку и хотя бы один трек.');
            return;
        } else if (initialData && existingTracks.length === 0 && newTracks.length === 0) {
            alert('В релизе должен быть хотя бы один трек.');
            return;
        }

        try {
            setLoading(true);
            setProgress('Сохранение информации...');

            let coverUrl = initialData?.cover_url || '';
            if (coverFile) {
                setProgress('Загрузка обложки...');
                coverUrl = await uploadFile(coverFile, 'images');
            }

            let releaseId = initialData?.id;
            const releasePayload = {
                title: formData.title,
                artist_name: formData.artistName,
                description: formData.description,
                genre: formData.genre,
                price: parseFloat(formData.price),
                cover_url: coverUrl,
                artist_id: artistId || (initialData as any)?.artist_id || null,
                is_published: true
            };

            if (initialData) {
                const { error: releaseError } = await supabase.from('releases').update(releasePayload).eq('id', initialData.id);
                if (releaseError) throw releaseError;
            } else {
                const { data, error: releaseError } = await supabase.from('releases').insert([releasePayload]).select().single();
                if (releaseError) throw releaseError;
                releaseId = data.id;
            }

            if (!releaseId) throw new Error("Не удалось получить ID релиза");

            // 3. Handle Existing Tracks
            if (initialData) {
                setProgress('Обновление уровней треков...');
                for (const track of existingTracks) {
                    const { error: trackUpdateError } = await supabase.from('tracks').update({
                        title: track.title,
                        artist_name: track.artist_name || formData.artistName
                    }).eq('id', track.id);

                    if (trackUpdateError) throw trackUpdateError;

                    // Sync Tagged Artists (Delete all then Insert new)
                    await supabase.from('track_artists').delete().eq('track_id', track.id);

                    if (track.tagged_artists && track.tagged_artists.length > 0) {
                        const artistInserts = track.tagged_artists.map(artist => ({
                            track_id: track.id,
                            artist_id: artist.id
                        }));
                        const { error: artistError } = await supabase.from('track_artists').insert(artistInserts);
                        if (artistError) throw artistError;
                    }
                }

                if (tracksToDelete.length > 0) {
                    const { error: deleteError } = await supabase.from('tracks').delete().in('id', tracksToDelete);
                    if (deleteError) throw deleteError;
                }
            }

            // 4. Upload & Insert NEW Tracks
            if (newTracks.length > 0) {
                setProgress(`Загрузка ${newTracks.length} новых треков...`);
                let startPos = 1;
                if (initialData && existingTracks.length > 0) {
                    const maxPos = existingTracks.reduce((max, t) => Math.max(max, t.position || 0), 0);
                    startPos = maxPos + 1;
                }

                for (let i = 0; i < newTracks.length; i++) {
                    const track = newTracks[i];
                    setProgress(`Загрузка трека ${i + 1}/${newTracks.length}: ${track.title}...`);
                    const audioUrl = await uploadFile(track.file, 'audio-files');

                    const { data: newTrackData, error: trackError } = await supabase.from('tracks').insert([{
                        release_id: releaseId,
                        title: track.title,
                        artist_name: track.artist_name || formData.artistName,
                        audio_url: audioUrl,
                        duration: 0,
                        position: startPos + i
                    }]).select('id').single();

                    if (trackError) throw trackError;

                    // Insert Tagged Artists for New Track
                    if (newTrackData && track.tagged_artists && track.tagged_artists.length > 0) {
                        const artistInserts = track.tagged_artists.map(artist => ({
                            track_id: newTrackData.id,
                            artist_id: artist.id
                        }));
                        const { error: artistInsertError } = await supabase.from('track_artists').insert(artistInserts);
                        if (artistInsertError) throw artistInsertError;
                    }
                }
            }

            setProgress('Готово!');
            onSuccess(releaseId);

        } catch (error: any) {
            console.error('Operation failed:', error);
            alert('Ошибка при сохранении: ' + error.message);
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    return (
        <div className="space-y-6 text-white text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Metadata */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[#B3B3B3] uppercase mb-1 block">Детали релиза</label>
                        <Input
                            placeholder="Название релиза"
                            value={formData.title}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            className="bg-[#282828] border-none text-white focus:ring-1 focus:ring-[#1DB954] mb-2"
                        />
                        <Input
                            placeholder="Имя главного исполнителя"
                            value={formData.artistName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, artistName: e.target.value })}
                            className="bg-[#282828] border-none text-white focus:ring-1 focus:ring-[#1DB954]"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Жанр"
                            value={formData.genre}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, genre: e.target.value })}
                            className="bg-[#282828] border-none text-white"
                        />
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Цена ($)"
                            value={formData.price}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: e.target.value })}
                            className="bg-[#282828] border-none text-white w-24"
                        />
                    </div>

                    <Textarea
                        placeholder="Описание (необязательно)"
                        value={formData.description}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-[#282828] border-none text-white h-24"
                    />
                </div>

                {/* Right Column: Files */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[#B3B3B3] uppercase mb-1 block">Обложка</label>
                        <div
                            className="h-32 bg-[#282828] rounded-md border-2 border-dashed border-[#B3B3B3]/30 hover:border-white/50 cursor-pointer flex flex-col items-center justify-center transition-all group overflow-hidden relative"
                            onClick={() => coverInputRef.current?.click()}
                        >
                            {coverPreview && !coverFile ? (
                                <img src={coverPreview} className="w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity" alt="Cover" />
                            ) : null}

                            {coverFile ? (
                                <div className="text-center z-10 p-2">
                                    <span className="text-green-500 font-bold block mb-1 text-sm">Новое изображение выбрано</span>
                                    <span className="text-[10px] text-[#B3B3B3] line-clamp-1">{coverFile.name}</span>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <Upload className="mb-2 text-[#B3B3B3] group-hover:text-white" />
                                    <span className="text-xs text-[#B3B3B3] group-hover:text-white shadow-black drop-shadow-md">
                                        {coverPreview ? 'Изменить обложку' : 'Загрузить обложку'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setCoverFile(e.target.files?.[0] || null)} />
                    </div>

                    <div>
                        {/* EXISTING TRACKS */}
                        {existingTracks.length > 0 && (
                            <div className="mb-4">
                                <label className="text-xs font-bold text-[#B3B3B3] uppercase mb-1 block">Существующие треки</label>
                                <div className="bg-[#282828] rounded-md p-1 space-y-1">
                                    {existingTracks.map((track) => (
                                        <div key={track.id} className="flex flex-col gap-1 bg-[#121212] p-2 rounded relative group">
                                            <div className="flex items-center gap-2">
                                                <FileAudio size={12} className="text-[#1DB954] shrink-0" />
                                                <Input
                                                    value={track.title}
                                                    onChange={(e) => handleUpdateExistingTrack(track.id, { title: e.target.value })}
                                                    className="h-6 text-[11px] bg-transparent border-none focus:ring-0 p-0 text-white w-full font-bold"
                                                    placeholder="Название трека"
                                                />
                                                <button onClick={() => handleRemoveExistingTrack(track.id)} className="text-[#B3B3B3] hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 pl-5">
                                                <User size={10} className="text-[#B3B3B3]" />
                                                <Input
                                                    value={track.artist_name || ''}
                                                    onChange={(e) => handleUpdateExistingTrack(track.id, { artist_name: e.target.value })}
                                                    className="h-5 text-[10px] bg-transparent border-none focus:ring-0 p-0 text-[#B3B3B3] w-full"
                                                    placeholder="Исполнитель трека"
                                                />
                                            </div>
                                            {isAdmin && (
                                                <div className="mt-2 pl-7">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {mainArtist && (
                                                            <div className="flex items-center gap-1 bg-[#1DB954]/20 border border-[#1DB954]/20 rounded-full px-2 py-0.5 text-[10px] text-white cursor-default" title="Main Release Artist">
                                                                <User size={10} className="text-[#1DB954]" />
                                                                <span className="font-bold">{mainArtist.full_name}</span>
                                                                <span className="text-[#1DB954] text-[9px] uppercase ml-1 opacity-70">Main</span>
                                                            </div>
                                                        )}
                                                        {track.tagged_artists?.map(artist => (
                                                            <div key={artist.id} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5 text-[10px] text-white">
                                                                <User size={10} />
                                                                <span>{artist.full_name}</span>
                                                                <button onClick={() => handleRemoveArtistFromExistingTrack(track.id, artist.id)} className="hover:text-red-500 ml-1">
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <UserSearchSelect
                                                        onSelect={(artist) => handleAddArtistToExistingTrack(track.id, artist)}
                                                        placeholder="Tag artist..."
                                                        className="w-48"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NEW TRACKS */}
                        <label className="text-xs font-bold text-[#B3B3B3] uppercase mb-1 flex justify-between">
                            <span>Новые треки ({newTracks.length})</span>
                            <span className="text-[#1DB954] cursor-pointer hover:underline text-[10px]" onClick={() => audioInputRef.current?.click()}>+ Добавить</span>
                        </label>

                        <div className="bg-[#282828] rounded-md p-1 space-y-1">
                            {newTracks.length === 0 ? (
                                <div className="h-16 flex flex-col items-center justify-center text-[#B3B3B3] cursor-pointer hover:bg-white/5 rounded transition-colors" onClick={() => audioInputRef.current?.click()}>
                                    <Music size={14} className="mb-1" />
                                    <span className="text-[10px]">Нажмите для выбора файлов</span>
                                </div>
                            ) : (
                                newTracks.map((track, idx) => (
                                    <div key={idx} className="flex flex-col gap-1 bg-[#121212] p-2 rounded relative group">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#B3B3B3] text-[9px] font-mono shrink-0">NEW</span>
                                            <FileAudio size={12} className="text-[#B3B3B3] shrink-0" />
                                            <Input
                                                value={track.title}
                                                onChange={(e) => handleUpdateNewTrack(idx, { title: e.target.value })}
                                                className="h-6 text-[11px] bg-transparent border-none focus:ring-0 p-0 text-white w-full font-bold"
                                                placeholder="Название трека"
                                            />
                                            <button onClick={() => removeNewTrack(idx)} className="text-[#B3B3B3] hover:text-red-500 shrink-0">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 pl-8">
                                            <User size={10} className="text-[#B3B3B3]" />
                                            <Input
                                                value={track.artist_name}
                                                onChange={(e) => handleUpdateNewTrack(idx, { artist_name: e.target.value })}
                                                className="h-5 text-[10px] bg-transparent border-none focus:ring-0 p-0 text-[#B3B3B3] w-full"
                                                placeholder="Исполнитель трека"
                                            />
                                        </div>
                                        {isAdmin && (
                                            <div className="mt-2 pl-9">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {mainArtist && (
                                                        <div className="flex items-center gap-1 bg-[#1DB954]/20 border border-[#1DB954]/20 rounded-full px-2 py-0.5 text-[10px] text-white cursor-default" title="Main Release Artist">
                                                            <User size={10} className="text-[#1DB954]" />
                                                            <span className="font-bold">{mainArtist.full_name}</span>
                                                            <span className="text-[#1DB954] text-[9px] uppercase ml-1 opacity-70">Main</span>
                                                        </div>
                                                    )}
                                                    {track.tagged_artists?.map(artist => (
                                                        <div key={artist.id} className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5 text-[10px] text-white">
                                                            <User size={10} />
                                                            <span>{artist.full_name}</span>
                                                            <button onClick={() => handleRemoveArtistFromNewTrack(idx, artist.id)} className="hover:text-red-500 ml-1">
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <UserSearchSelect
                                                    onSelect={(artist) => handleAddArtistToNewTrack(idx, artist)}
                                                    placeholder="Tag artist..."
                                                    className="w-48"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <input type="file" ref={audioInputRef} multiple className="hidden" accept="audio/*" onChange={handleFileSelect} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                <Button variant="ghost" onClick={onCancel} disabled={loading} className="text-white hover:bg-white/10">Отмена</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-bold min-w-[120px]">
                    {loading ? <div className="flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" />{progress}</div> : (initialData ? 'Сохранить' : 'Опубликовать')}
                </Button>
            </div>
        </div >
    );
};

export default ReleaseUploadForm;
