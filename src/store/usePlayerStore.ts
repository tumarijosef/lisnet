import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types';

interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    queue: Track[];
    isExpanded: boolean;
    setCurrentTrack: (track: Track | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setQueue: (queue: Track[]) => void;
    setIsExpanded: (expanded: boolean) => void;
    playNext: () => void;
    playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            currentTrack: null,
            isPlaying: false,
            queue: [],
            isExpanded: false,
            setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: !!track }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
            setQueue: (queue) => set({ queue }),
            setIsExpanded: (expanded) => set({ isExpanded: expanded }),
            playNext: () => {
                const { currentTrack, queue } = get();
                if (!currentTrack || queue.length === 0) return;
                const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
                if (currentIndex < queue.length - 1) {
                    set({ currentTrack: queue[currentIndex + 1] });
                }
            },
            playPrevious: () => {
                const { currentTrack, queue } = get();
                if (!currentTrack || queue.length === 0) return;
                const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
                if (currentIndex > 0) {
                    set({ currentTrack: queue[currentIndex - 1] });
                }
            }
        }),
        {
            name: 'lisnet-player-storage',
            partialize: (state) => ({
                currentTrack: state.currentTrack,
                queue: state.queue,
                // Don't persist isPlaying to avoid auto-playing on refresh, unless desired. 
                // Often better to start paused or let user resume.
                // But for "state preservation", we might keep it or force false.
                isPlaying: false
            }),
        }
    )
);
