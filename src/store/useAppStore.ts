import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TRACKS as INITIAL_TRACKS, POSTS as INITIAL_POSTS } from '../data';
import { USERS as INITIAL_USERS } from '../pages/admin/adminData';

// Types
export interface Track {
    id: string;
    title: string;
    artistName: string;
    artistId: string; // Added to match global types
    coverUrl: string;
    audioUrl: string;
    duration: number;
    price: number;
    plays: number;
    isLiked?: boolean; // Wishlist
    isPurchased?: boolean; // Collection
    isRecommended?: boolean;
    genre?: string;
    releaseId?: string;
}

export interface Post {
    id: string;
    artistName: string;
    artistAvatar: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: number;
    trackId?: string;
    timestamp: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'artist';
    status: 'active' | 'banned';
    joinDate: string;
    avatarUrl?: string;
}

interface AppState {
    tracks: Track[];
    posts: Post[];
    users: User[];

    // Track Actions
    addTrack: (track: Track) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    deleteTrack: (id: string) => void;
    toggleLikeTrack: (id: string) => void;
    purchaseTrack: (id: string) => void;

    // Post Actions
    addPost: (post: Post) => void;
    updatePost: (id: string, updates: Partial<Post>) => void;
    deletePost: (id: string) => void;

    // User Actions
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;

    // Reset Store (Administrative)
    resetStore: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            tracks: INITIAL_TRACKS.map(t => ({
                ...t,
                plays: 0,
                genre: 'Electronic',
                price: 0.99,
                isLiked: false,
                isPurchased: false,
                isRecommended: true
            })),
            posts: INITIAL_POSTS.map(p => ({
                ...p,
                timestamp: new Date().toISOString()
            })),
            users: INITIAL_USERS.map(u => ({
                ...u,
                joinDate: u.dateJoined,
                avatarUrl: `https://ui-avatars.com/api/?name=${u.username}&background=random`
            })),

            // Track Implementation
            addTrack: (track) => set((state) => ({
                tracks: [track, ...state.tracks]
            })),
            updateTrack: (id, updates) => set((state) => ({
                tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
            })),
            deleteTrack: (id) => set((state) => ({
                tracks: state.tracks.filter(t => t.id !== id)
            })),
            toggleLikeTrack: (id) => set((state) => ({
                tracks: state.tracks.map(t => t.id === id ? { ...t, isLiked: !t.isLiked } : t)
            })),
            purchaseTrack: (id) => set((state) => ({
                tracks: state.tracks.map(t => t.id === id ? { ...t, isPurchased: true } : t)
            })),

            // Post Implementation
            addPost: (post) => set((state) => ({
                posts: [post, ...state.posts]
            })),
            updatePost: (id, updates) => set((state) => ({
                posts: state.posts.map(p => p.id === id ? { ...p, ...updates } : p)
            })),
            deletePost: (id) => set((state) => ({
                posts: state.posts.filter(p => p.id !== id)
            })),

            // User Implementation
            updateUser: (id, updates) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter(u => u.id !== id)
            })),

            // Reset
            resetStore: () => set({
                tracks: INITIAL_TRACKS.map(t => ({
                    ...t,
                    plays: 0,
                    genre: 'Electronic',
                    price: 0.99,
                    isLiked: false,
                    isPurchased: false,
                    isRecommended: true
                })),
                posts: INITIAL_POSTS.map(p => ({
                    ...p,
                    timestamp: new Date().toISOString()
                })),
                users: INITIAL_USERS.map(u => ({
                    ...u,
                    joinDate: u.dateJoined,
                    avatarUrl: `https://ui-avatars.com/api/?name=${u.username}&background=random`
                }))
            })
        }),
        {
            name: 'lisnet-storage-v1', // Updated name to force fresh start
            storage: createJSONStorage(() => localStorage), // Explicit storage
            version: 1,
        }
    )
);
