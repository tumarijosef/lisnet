import { Artist, Track, Post } from './types';

export const ARTISTS: Artist[] = [
    {
        id: '1',
        name: 'Techno Viking',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
        bio: 'Electronic music producer from Berlin.',
        followers: 12500
    },
    {
        id: '2',
        name: 'Synth Wave',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        bio: 'Retro vibes and neon lights.',
        followers: 8400
    }
];

export const TRACKS: Track[] = [
    {
        id: 't1',
        title: 'Neon Nights',
        artistId: '2',
        artistName: 'Synth Wave',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        price: 0.99,
        duration: 180,
        releaseId: 'r1'
    },
    {
        id: 't2',
        title: 'Berlin Underground',
        artistId: '1',
        artistName: 'Techno Viking',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        price: 1.49,
        duration: 320,
        releaseId: 'r2'
    },
    {
        id: 't3',
        title: 'Midnight Drive',
        artistId: '2',
        artistName: 'Synth Wave',
        coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        price: 0.99,
        duration: 210,
        releaseId: 'r1'
    }
];

export const POSTS: Post[] = [
    {
        id: 'p1',
        artistId: '1',
        artistName: 'Techno Viking',
        artistAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
        content: 'Just dropped a new banger! Check it out below.',
        imageUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a7439?w=800&h=400&fit=crop',
        trackId: 't2',
        likes: 420,
        comments: 69,
        createdAt: '2024-03-20T12:00:00Z'
    },
    {
        id: 'p2',
        artistId: '2',
        artistName: 'Synth Wave',
        artistAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        content: 'Feeling the retro vibes today.',
        trackId: 't1',
        likes: 154,
        comments: 12,
        createdAt: '2024-03-19T15:30:00Z'
    }
];
