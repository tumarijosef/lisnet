import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Repeat, Shuffle, Heart, Plus, MoreHorizontal, Share, ListMusic, Laptop2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { FastAverageColor } from 'fast-average-color';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';
import AddToPlaylistModal from './AddToPlaylistModal';

const FloatingPlayer = () => {
    const navigate = useNavigate();
    const { currentTrack, isPlaying, isExpanded, setIsPlaying, setIsExpanded, playNext, playPrevious } = usePlayerStore();
    const { profile } = useAuthStore();
    const { likedTrackIds, toggleLike } = useLibraryStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [adaptiveColor, setAdaptiveColor] = useState({
        hex: '#181818',
        isDark: true
    });
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

    const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false;

    // 1. Adaptive Color Logic
    useEffect(() => {
        if (currentTrack?.coverUrl) {
            const fac = new FastAverageColor();
            fac.getColorAsync(currentTrack.coverUrl)
                .then(color => {
                    setAdaptiveColor({
                        hex: color.hex,
                        isDark: color.isDark
                    });
                })
                .catch(() => {
                    setAdaptiveColor({ hex: '#181818', isDark: true });
                });
        }
    }, [currentTrack?.coverUrl]);

    // 2. Handle Source Change
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            audioRef.current.src = currentTrack.audioUrl;
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed:", e));
            }
        }
    }, [currentTrack]);

    // 3. Handle Play/Pause and Media Session
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed:", e));
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            } else {
                audioRef.current.pause();
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                }
            }
        }
    }, [isPlaying]);

    // 4. Media Session Integration
    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artistName,
                album: currentTrack.releaseTitle || 'Single',
                artwork: [
                    { src: currentTrack.coverUrl || '', sizes: '96x96', type: 'image/jpeg' },
                    { src: currentTrack.coverUrl || '', sizes: '128x128', type: 'image/jpeg' },
                    { src: currentTrack.coverUrl || '', sizes: '192x192', type: 'image/jpeg' },
                    { src: currentTrack.coverUrl || '', sizes: '256x256', type: 'image/jpeg' },
                    { src: currentTrack.coverUrl || '', sizes: '384x384', type: 'image/jpeg' },
                    { src: currentTrack.coverUrl || '', sizes: '512x512', type: 'image/jpeg' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
            navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
            navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && audioRef.current) {
                    audioRef.current.currentTime = details.seekTime;
                }
            });
        }
    }, [currentTrack, setIsPlaying, playNext, playPrevious]);

    if (!currentTrack) return null;

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
    };

    const handleToggleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentTrack && profile) {
            toggleLike(profile.id, currentTrack.id);
        }
    };

    const handleNavigateToRelease = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentTrack?.releaseId) {
            // Check if we are already on this release page to avoid redundant navigation
            const currentPath = window.location.pathname;
            const targetPath = `/release/${currentTrack.releaseId}`;

            if (currentPath === targetPath) {
                setIsExpanded(false);
                return;
            }

            setIsExpanded(false);
            navigate(targetPath, { replace: true });
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // COLOR PALETTE BASED ON BACKGROUND BRIGHTNESS
    const isDark = adaptiveColor.isDark;
    const uiColor = isDark ? '#FFFFFF' : '#000000';
    const uiDimColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const uiBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    // Expanded Player View
    if (isExpanded) {
        return (
            <div
                className="fixed inset-0 z-[999] flex flex-col p-4 expanded-player-window overflow-hidden animate-in slide-in-from-bottom duration-500 transition-colors duration-700"
                style={{ backgroundColor: adaptiveColor.hex }}
            >
                <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={playNext} />
                <AddToPlaylistModal
                    isOpen={isPlaylistModalOpen}
                    onClose={() => setIsPlaylistModalOpen(false)}
                    trackId={currentTrack.id}
                />

                {/* Header Row - Spotify Style - Moved Up */}
                <div className="flex justify-between items-center mb-0 relative z-10 px-2 mt-0">
                    <button onClick={() => setIsExpanded(false)} style={{ color: uiColor }} className="hover:opacity-60 transition-all p-2">
                        <ChevronDown size={30} />
                    </button>
                    <div className="flex-1" /> {/* Empty center */}
                    <div className="w-12" /> {/* Spacer */}
                </div>

                {/* Centered Body Container - Perfectly balanced from top/bottom and left/right */}
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto relative z-10 px-4">

                    {/* 1. Artwork - Sharp Corners */}
                    <div className="mb-6 w-full aspect-square max-w-[280px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-none border border-white/5">
                        <img
                            src={currentTrack.coverUrl || 'https://via.placeholder.com/600'}
                            alt={currentTrack.title}
                            className="absolute inset-0 w-full h-full object-cover shadow-inner"
                        />
                    </div>

                    {/* 2. Track Info - Centered */}
                    <div className="w-full flex flex-col items-center mb-6 text-center">
                        <div className="w-full mb-4">
                            <h1
                                onClick={handleNavigateToRelease}
                                className="text-xl font-black tracking-tight leading-tight cursor-pointer hover:underline text-white truncate px-2"
                            >
                                {currentTrack.title}
                            </h1>
                            <p
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                    navigate(`/search?q=${encodeURIComponent(currentTrack.artistName)}`);
                                }}
                                className="text-sm font-bold opacity-60 mt-1 truncate cursor-pointer hover:underline inline-block"
                                style={{ color: uiColor }}
                            >
                                {currentTrack.artistName}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-8 shrink-0">
                            <button onClick={handleToggleLike} style={{ color: isLiked ? '#1DB954' : uiColor }} className="p-2 transition-all active:scale-125">
                                <Heart size={26} fill={isLiked ? '#1DB954' : 'none'} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPlaylistModalOpen(true); }}
                                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-white/10 hover:border-white transition-all active:scale-90"
                                style={{ color: uiColor }}
                            >
                                <Plus size={22} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* 3. Controls Section - Now part of centered group */}
                    <div className="space-y-6 w-full max-w-[95%]">
                        {/* Progress Bar */}
                        <div className="space-y-3">
                            <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: uiBgColor }}>
                                <div
                                    className="absolute top-0 left-0 h-full transition-all duration-100"
                                    style={{
                                        width: `${(currentTime / duration) * 100}%`,
                                        backgroundColor: uiColor
                                    }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={currentTime || 0}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-black tracking-widest opacity-40 px-0.5" style={{ color: uiColor }}>
                                <span>{formatTime(currentTime)}</span>
                                <span>-{formatTime(duration - currentTime)}</span>
                            </div>
                        </div>

                        {/* Command Center */}
                        <div className="flex items-center justify-between">
                            <button className="text-[#1DB954] hover:scale-110 transition-transform"><Shuffle size={20} /></button>
                            <button onClick={playPrevious} style={{ color: uiColor }} className="hover:scale-110 active:scale-90 transition-all p-2">
                                <SkipBack size={30} fill="currentColor" stroke="none" />
                            </button>
                            <button
                                onClick={handlePlayPause}
                                className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all active:scale-95 bg-white"
                                style={{ backgroundColor: uiColor, color: isDark ? 'black' : 'white' }}
                            >
                                {isPlaying ? <Pause size={30} fill="currentColor" stroke="none" /> : <Play size={30} fill="currentColor" stroke="none" className="ml-1" />}
                            </button>
                            <button onClick={playNext} style={{ color: uiColor }} className="hover:scale-110 active:scale-90 transition-all p-2">
                                <SkipForward size={30} fill="currentColor" stroke="none" />
                            </button>
                            <button style={{ color: uiColor }} className="opacity-60 hover:scale-110 transition-transform"><Repeat size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Mini Player View (Dark/Opaque always as requested)
    return (
        <div
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-[96px] left-0 right-0 mini-player-container p-2 pl-4 flex items-center justify-between z-[200] animate-in slide-in-from-bottom overflow-hidden cursor-pointer border-t border-white/10"
            style={{ backgroundColor: '#181818' }}
        >
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={playNext} />
            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                trackId={currentTrack.id}
            />

            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative w-12 h-12 flex-shrink-0">
                    <img
                        src={currentTrack.coverUrl || 'https://via.placeholder.com/64'}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover rounded-none"
                    />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                    <h4 className="font-black text-sm text-white truncate leading-tight tracking-tight">
                        {currentTrack.title}
                    </h4>
                    <p className="text-[11px] text-[#B3B3B3] font-black uppercase tracking-tighter truncate leading-tight mt-0.5">{currentTrack.artistName}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 pr-4">
                <button
                    onClick={handleToggleLike}
                    className="w-10 h-10 flex items-center justify-center transition-all active:scale-125"
                    style={{ color: isLiked ? '#1DB954' : 'white' }}
                >
                    <Heart size={20} fill={isLiked ? '#1DB954' : 'none'} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsPlaylistModalOpen(true); }}
                    className="w-10 h-10 flex items-center justify-center text-white transition-all active:scale-125 opacity-40 hover:opacity-100"
                >
                    <Plus size={20} />
                </button>
                <button
                    onClick={handlePlayPause}
                    className="text-white w-10 h-10 flex items-center justify-center transition-all active:scale-90 hover:bg-white/5"
                >
                    {isPlaying ? <Pause size={28} fill="white" stroke="none" /> : <Play size={28} fill="white" stroke="none" className="ml-0.5" />}
                </button>
            </div>

            {/* Progress line */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                <div
                    className="h-full bg-[#1DB954]"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                />
            </div>
        </div>
    );
};

export default FloatingPlayer;
