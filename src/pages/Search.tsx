import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Play } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../lib/translations';
import { useTracks, Track } from '../hooks/useTracks';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

const GENRE_COLORS = [
    'from-red-600 to-red-900',
    'from-orange-500 to-orange-800',
    'from-cyan-500 to-blue-900',
    'from-pink-500 to-purple-900',
    'from-green-600 to-emerald-900',
    'from-indigo-400 to-indigo-900',
    'from-gray-600 to-gray-900',
    'from-purple-400 to-purple-800',
    'from-blue-600 to-indigo-800',
    'from-yellow-500 to-orange-600',
];

const Search = () => {
    const navigate = useNavigate();
    const { tracks, loading } = useTracks();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const { setCurrentTrack, setQueue } = usePlayerStore();
    const { language } = useLanguageStore();
    const t = translations[language].search;

    useEffect(() => {
        const searchUsers = async () => {
            const rawQuery = searchQuery.trim();
            if (rawQuery.length < 2) {
                setFoundUsers([]);
                return;
            }

            setSearchingUsers(true);
            try {
                // Split by comma first (phrases - OR logic)
                const phrases = rawQuery.toLowerCase().split(',').map(p => p.trim()).filter(Boolean);
                if (phrases.length === 0) return;

                // Build a comprehensive OR filter for Supabase
                // Extract all unique words from all phrases to get a broad list of candidates
                const allWords = Array.from(new Set(phrases.flatMap(phrase => phrase.split(/\s+/).filter(Boolean))));

                const orFilter = allWords.flatMap(word => [
                    `username.ilike.%${word}%`,
                    `full_name.ilike.%${word}%`
                ]).join(',');

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(orFilter)
                    .limit(40); // Fetch enough candidates to filter locally

                if (error) throw error;

                // local "smart" filtering to ensure all words within a phrase match
                // (e.g. if searching "Josef Tumari", it must contain both words)
                const filtered = (data || []).filter(user => {
                    const name = (user.full_name || '').toLowerCase();
                    const username = (user.username || '').toLowerCase();

                    return phrases.some(phrase => {
                        const words = phrase.split(/\s+/).filter(Boolean);
                        // All words in a given phrase must be found in name or username (AND logic within phrase)
                        return words.every(word => name.includes(word) || username.includes(word));
                    });
                });

                // Sort by relevance (full match first)
                const sorted = filtered.sort((a, b) => {
                    const aName = (a.full_name || '').toLowerCase();
                    const bName = (b.full_name || '').toLowerCase();
                    const queryLower = phrases[0]; // Primary focus on first term

                    if (aName === queryLower) return -1;
                    if (bName === queryLower) return 1;
                    return 0;
                });

                setFoundUsers(sorted.slice(0, 10)); // Show more results if multiple terms
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setSearchingUsers(false);
            }
        };

        const timer = setTimeout(searchUsers, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle initial query from URL
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) setSearchQuery(q);
    }, [searchParams]);

    // Dynamically calculate most popular genres from tracks
    const popularGenres = useMemo(() => {
        if (!tracks || tracks.length === 0) return [];

        const genreCounts: Record<string, number> = {};
        tracks.forEach(track => {
            if (track.genre) {
                const genres = track.genre.split(',').map(g => g.trim());
                genres.forEach(g => {
                    if (g && g.toLowerCase() !== 'electronic') { // Skip generic 'electronic' if possible
                        genreCounts[g] = (genreCounts[g] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count
            .slice(0, 10) // Top 10
            .map(([name], index) => ({
                name,
                color: GENRE_COLORS[index % GENRE_COLORS.length],
                // Use a default music-themed image if we don't have specific ones
                image: `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop&sig=${index}`
            }));
    }, [tracks]);

    const filteredTracks = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return [];

        // Split query by commas (Phrases - OR logic)
        const phrases = query.split(',').map(p => p.trim()).filter(Boolean);

        return tracks.filter((track: Track) => {
            const trackTitle = track.title.toLowerCase();
            const artistName = track.artistName.toLowerCase();
            const trackGenres = (track.genre || '').toLowerCase();

            // Match if ANY phrase matches
            return phrases.some(phrase => {
                // Split phrase into words (Keywords - AND logic)
                const words = phrase.split(/\s+/).filter(Boolean);
                if (words.length === 0) return false;

                // Every word in the phrase must be found in title, artist, or genre
                return words.every(word =>
                    trackTitle.includes(word) ||
                    artistName.includes(word) ||
                    trackGenres.includes(word)
                );
            });
        });
    }, [searchQuery, tracks]);

    const handlePlayTrack = (trackId: string) => {
        const track = tracks.find(t => t.id === trackId);
        if (track) {
            setCurrentTrack(track);
            setQueue(tracks);
        }
    };

    return (
        <div className="flex flex-col p-4 pt-6 bg-[#121212] min-h-screen pb-24">
            <h1 className="text-3xl font-black tracking-tighter text-white mb-6 uppercase">{t.title}</h1>

            <div className="relative mb-8 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                    <SearchIcon className="text-[#121212]" size={20} />
                </div>
                <input
                    type="text"
                    placeholder={t.placeholder}
                    className="w-full bg-white text-[#121212] placeholder-gray-400 rounded-xl py-4 pl-12 pr-4 font-bold focus:outline-none shadow-xl border-none ring-0 focus:ring-4 focus:ring-[#1DB954]/20 transition-all font-sans"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-[#B3B3B3] font-black uppercase tracking-widest animate-pulse">
                    Searching...
                </div>
            ) : searchQuery ? (
                <div className="flex flex-col gap-6">
                    {/* Users Results */}
                    {foundUsers.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-white font-black text-xs uppercase tracking-widest pl-1 opacity-50">Profiles</h3>
                            <div className="flex flex-col gap-1">
                                {foundUsers.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => navigate(`/profile/${user.id}`)}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-[#282828] flex items-center justify-center text-white/20">
                                                    <SearchIcon size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-bold truncate text-sm">{user.full_name || user.username}</h4>
                                            <p className="text-[#B3B3B3] text-[10px] uppercase tracking-widest font-black mt-0.5">@{user.username}</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-black text-white uppercase tracking-tighter hover:bg-white hover:text-black transition-colors">
                                            View
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tracks Results */}
                    <div className="flex flex-col gap-3">
                        {foundUsers.length > 0 && filteredTracks.length > 0 && (
                            <h3 className="text-white font-black text-xs uppercase tracking-widest pl-1 opacity-50">Tracks</h3>
                        )}
                        {filteredTracks.length > 0 ? (
                            filteredTracks.map(track => (
                                <div
                                    key={track.id}
                                    onClick={() => handlePlayTrack(track.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all active:scale-[0.98] border border-transparent hover:border-white/5"
                                >
                                    <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg shadow-lg">
                                        <img src={track.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={track.title} />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold truncate text-sm leading-tight mb-1">{track.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-[#B3B3B3] text-[10px] truncate uppercase tracking-widest font-medium shrink-0">{track.artistName}</p>
                                            {track.genre && track.genre.split(',').map((g, i) => (
                                                <span key={i} className="text-[8px] bg-white/5 text-[#1DB954] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-tighter border border-[#1DB954]/20">
                                                    {g.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                        <Play size={18} fill="currentColor" />
                                    </div>
                                </div>
                            ))
                        ) : foundUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center mt-20 opacity-30">
                                <SearchIcon size={64} className="text-white mb-4" />
                                <p className="text-white font-black uppercase tracking-widest text-sm text-center px-4">{t.no_results} "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <h2 className="text-white font-black text-lg tracking-tighter uppercase">{t.browse}</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {popularGenres.length > 0 ? (
                            popularGenres.map((genre: { name: string; color: string; image: string }) => (
                                <div
                                    key={genre.name}
                                    onClick={() => setSearchQuery(genre.name)}
                                    className={`h-28 rounded-xl overflow-hidden relative cursor-pointer bg-gradient-to-br ${genre.color} shadow-lg active:scale-[0.95] transition-transform group border border-white/10`}
                                >
                                    <span className="absolute top-4 left-4 font-black text-white text-lg break-words w-2/3 leading-none tracking-tighter uppercase group-hover:scale-105 transition-transform">{genre.name}</span>
                                    <img
                                        src={genre.image}
                                        alt={genre.name}
                                        className="absolute -bottom-2 -right-6 w-20 h-20 rounded-lg shadow-2xl transform rotate-[25deg] group-hover:rotate-[20deg] group-hover:scale-110 transition-all duration-500 object-cover"
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-10 text-[#B3B3B3] font-bold opacity-30 uppercase tracking-widest text-xs">
                                No genres found in your library
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
