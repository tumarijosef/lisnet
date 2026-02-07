import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Edit2, Trash2, Plus, Loader2, Disc, ChevronDown, ChevronRight, User, X } from "lucide-react";
import { supabase } from '../../lib/supabase';
import ReleaseUploadForm from './ReleaseUploadForm';

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
    main_artist?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        username?: string;
    };
}

interface Track {
    id: string;
    title: string;
    artist_name?: string;
    duration: number;
    audio_url: string;
    position: number;
}

const MusicLibrary = () => {
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRelease, setEditingRelease] = useState<Release | null>(null);
    const [expandedReleaseId, setExpandedReleaseId] = useState<string | null>(null);

    // Fetch Releases
    const fetchReleases = async () => {
        try {
            setLoading(true);

            // Attempt 1: Fetch with track_artists (Advanced)
            let { data, error } = await supabase
                .from('releases')
                .select(`
                    *,
                    main_artist:profiles!artist_id (id, full_name, avatar_url, username),
                    tracks (
                        id, title, artist_name, duration, audio_url, position,
                        track_artists (
                            artist:profiles (id, full_name, avatar_url, username)
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            // Fallback: If table doesn't exist, fetch without track_artists
            if (error) {
                console.warn('Advanced fetch failed (likely missing track_artists table), falling back to basic fetch.', error);
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('releases')
                    .select(`
                        *,
                        tracks (
                            id, title, artist_name, duration, audio_url, position
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (fallbackError) throw fallbackError;
                data = fallbackData;
            }

            // Sort tracks
            const formattedData = data?.map((rel: any) => ({
                ...rel,
                tracks: rel.tracks?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            }));

            setReleases(formattedData || []);
        } catch (error) {
            console.error('Error fetching releases:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReleases();
    }, []);

    const handleDelete = async (release: Release) => {
        if (!confirm(`Вы уверены, что хотите удалить "${release.title}"? Это удалит все связанные треки.`)) return;

        try {
            // 1. Delete Cover Image
            if (release.cover_url) {
                const urlParts = release.cover_url.split('/images/');
                if (urlParts.length > 1) {
                    await supabase.storage.from('images').remove([urlParts[1]]);
                }
            }

            // 2. Delete Audio Files (All tracks)
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

            // 3. Delete DB Record
            const { error } = await supabase.from('releases').delete().eq('id', release.id);
            if (error) throw error;

            setReleases(releases.filter(r => r.id !== release.id));

        } catch (error: any) {
            console.error('Error deleting release:', error);
            alert('Не удалось удалить: ' + error.message);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black tracking-tighter text-white">Музыкальная библиотека</h2>
                <Button onClick={() => { setEditingRelease(null); setIsModalOpen(true); }} className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-bold">
                    <Plus className="mr-2 h-4 w-4" /> Добавить релиз
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-[#B3B3B3]">
                    <Loader2 className="animate-spin mr-2" /> Загрузка...
                </div>
            ) : (
                <div className="rounded-md border border-white/10 bg-[#121212] overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5 bg-[#181818]">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[80px] text-[#B3B3B3]">Обложка</TableHead>
                                <TableHead className="text-[#B3B3B3]">Название</TableHead>
                                <TableHead className="text-[#B3B3B3]">Артист</TableHead>
                                <TableHead className="text-[#B3B3B3]">Жанр</TableHead>
                                <TableHead className="text-[#B3B3B3]">Треки</TableHead>
                                <TableHead className="text-[#B3B3B3]">Цена</TableHead>
                                <TableHead className="text-right text-[#B3B3B3]">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {releases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-[#B3B3B3]">
                                        Библиотека пуста. Загрузите свой первый альбом или сингл!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                releases.map((release) => (
                                    <>
                                        {/* Release Row */}
                                        <TableRow key={release.id} className="border-white/10 hover:bg-white/5 cursor-pointer" onClick={() => toggleExpand(release.id)}>
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    {expandedReleaseId === release.id ? <ChevronDown size={16} className="text-white" /> : <ChevronRight size={16} className="text-[#B3B3B3]" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative w-12 h-12 rounded bg-[#282828] overflow-hidden group border border-white/5 shadow-lg">
                                                    {release.cover_url ? (
                                                        <img src={release.cover_url} className="w-full h-full object-cover" alt={release.title} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#B3B3B3]">
                                                            <Disc size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-white text-base">{release.title}</TableCell>
                                            <TableCell className="text-[#B3B3B3]">{release.artist_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[#B3B3B3] border-white/20 font-mono text-[10px] uppercase tracking-wider">{release.genre}</Badge>
                                            </TableCell>
                                            <TableCell className="text-[#B3B3B3] font-mono text-xs">
                                                {release.tracks?.length || 0} трек(ов)
                                            </TableCell>
                                            <TableCell className="text-green-500 font-bold font-mono">${release.price}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-[#B3B3B3] hover:text-white hover:bg-white/10"
                                                        onClick={() => handleEdit(release)}
                                                        title="Редактировать"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(release)}
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Tracks View */}
                                        {expandedReleaseId === release.id && (
                                            <TableRow className="bg-[#121212] hover:bg-[#121212] border-none shadow-inner">
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="p-6 pl-24 bg-gradient-to-b from-black/20 to-transparent border-b border-white/5">
                                                        <h4 className="text-[10px] font-black text-[#B3B3B3] uppercase mb-4 tracking-[0.2em]">Список треков</h4>
                                                        {release.tracks && release.tracks.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {release.tracks.map((track, idx) => (
                                                                    <div key={track.id} className="flex items-center text-sm text-[#B3B3B3] p-2 hover:bg-white/5 rounded transition-all group">
                                                                        <span className="w-8 text-right mr-4 font-mono text-[10px] text-[#535353]">{idx + 1}</span>
                                                                        <div className="flex flex-col flex-1">
                                                                            <span className="text-white font-medium group-hover:text-[#1DB954] transition-colors">{track.title}</span>
                                                                            {track.artist_name && track.artist_name !== release.artist_name && (
                                                                                <span className="text-[10px] text-[#B3B3B3] flex items-center gap-1 mt-0.5">
                                                                                    <User size={10} className="shrink-0" /> {track.artist_name}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="font-mono text-[10px] opacity-30 group-hover:opacity-60 transition-opacity">WAV/MP3</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-[#B3B3B3]">В этом релизе пока нет треков.</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/99 flex items-center justify-center z-[600] p-0 md:p-4 backdrop-blur-md transition-all duration-300">
                    <div className="bg-[#181818] rounded-none md:rounded-2xl p-6 md:p-8 w-full max-w-2xl border-none md:border md:border-white/10 shadow-3xl relative h-full md:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">
                            {editingRelease ? 'Редактировать релиз' : 'Добавить новый релиз'}
                        </h3>

                        <ReleaseUploadForm
                            isAdmin={true}
                            initialData={editingRelease || undefined}
                            // Pass the fetched main artist so the form can display who "owns" the release
                            mainArtist={editingRelease?.main_artist}
                            onSuccess={handleUploadSuccess}
                            onCancel={handleCloseModal}
                        />

                        <button
                            onClick={handleCloseModal}
                            className="absolute top-6 right-6 text-[#B3B3B3] hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicLibrary;
