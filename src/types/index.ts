export interface Artist {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    followers: number;
}

export interface Track {
    id: string;
    title: string;
    artistId: string;
    artistName: string;
    coverUrl: string;
    audioUrl: string;
    price?: number;
    duration: number;
    releaseId?: string;
    releaseTitle?: string;
}

export interface Post {
    id: string;
    artistId: string;
    artistName: string;
    artistAvatar: string;
    content: string;
    imageUrl?: string;
    trackId?: string;
    likes: number;
    comments: number;
    createdAt: string;
}

export interface Profile {
    id: string;
    telegram_id: number;
    username: string;
    full_name: string;
    avatar_url: string;
    role: 'admin' | 'user' | 'artist';
    artist_type?: 'none' | 'artist' | 'label';
    created_at: string;
    last_seen?: string;
}
