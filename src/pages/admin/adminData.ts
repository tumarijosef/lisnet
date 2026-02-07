
// Mock data for Admin Dashboard

export interface AdminStats {
    totalUsers: number;
    totalRevenue: number; // in TON
    activeStreams: number;
    totalTracks: number;
    revenueHistory: { name: string; revenue: number }[];
}

export const ADMIN_STATS: AdminStats = {
    totalUsers: 15420,
    totalRevenue: 4500,
    activeStreams: 320,
    totalTracks: 1250,
    revenueHistory: [
        { name: 'Jan 1', revenue: 120 },
        { name: 'Jan 5', revenue: 150 },
        { name: 'Jan 10', revenue: 180 },
        { name: 'Jan 15', revenue: 250 },
        { name: 'Jan 20', revenue: 300 },
        { name: 'Jan 25', revenue: 280 },
        { name: 'Jan 30', revenue: 450 },
    ],
};

export interface AdminUser {
    id: string;
    username: string;
    role: 'user' | 'artist' | 'admin';
    status: 'active' | 'banned';
    dateJoined: string;
    email: string; // Internal use
}

export const USERS: AdminUser[] = [
    { id: 'u1', username: 'technoviking', role: 'artist', status: 'active', dateJoined: '2023-11-01', email: 'techno@berlin.de' },
    { id: 'u2', username: 'synthwave_lover', role: 'user', status: 'active', dateJoined: '2023-12-15', email: 'synth@wave.com' },
    { id: 'u3', username: 'spammer_bot', role: 'user', status: 'banned', dateJoined: '2024-01-20', email: 'spam@bot.net' },
    { id: 'u4', username: 'admin_josef', role: 'admin', status: 'active', dateJoined: '2023-10-05', email: 'admin@lisnet.app' },
    { id: 'u5', username: 'new_artist_01', role: 'artist', status: 'active', dateJoined: '2024-02-01', email: 'artist@new.com' },
];

export interface AdminTrack {
    id: string;
    title: string;
    artist: string;
    price: number;
    streams: number;
    status: 'approved' | 'pending' | 'rejected';
    coverUrl: string;
}

export const ADMIN_TRACKS: AdminTrack[] = [
    { id: 't1', title: 'Neon Nights', artist: 'Synth Wave', price: 0.99, streams: 5400, status: 'approved', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17' },
    { id: 't2', title: 'Berlin Underground', artist: 'Techno Viking', price: 1.49, streams: 12000, status: 'approved', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745' },
    { id: 't3', title: 'Experimental Noise', artist: 'New Artist 01', price: 0.50, streams: 10, status: 'pending', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9' },
];

export interface AdminTransaction {
    id: string;
    user: string;
    amount: number;
    type: 'purchase' | 'payout';
    status: 'completed' | 'pending' | 'failed';
    date: string;
}

export const ADMIN_TRANSACTIONS: AdminTransaction[] = [
    { id: 'tx1', user: 'synthwave_lover', amount: 1.49, type: 'purchase', status: 'completed', date: '2024-02-06' },
    { id: 'tx2', user: 'technoviking', amount: 500, type: 'payout', status: 'pending', date: '2024-02-05' },
];
