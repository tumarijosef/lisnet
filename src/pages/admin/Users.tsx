import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Search, Edit2, Ban, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Profile {
    id: string;
    telegram_id: number;
    username: string;
    full_name: string;
    avatar_url: string;
    role: 'admin' | 'user' | 'artist';
    status?: 'active' | 'banned';
    artist_type?: 'none' | 'artist' | 'label';
    created_at: string;
}

const Users = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);

    // Form State for editing
    const [formData, setFormData] = useState<Partial<Profile>>({
        username: '',
        role: 'user',
        status: 'active',
        artist_type: 'none'
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleEdit = (user: Profile) => {
        setEditingUser(user);

        // Determine the "Display Role" based on DB values
        let displayRole = 'user';
        if (user.role === 'admin') displayRole = 'admin';
        else if (user.role === 'artist') {
            if (user.artist_type === 'label') displayRole = 'label';
            else displayRole = 'artist';
        }

        setFormData({
            ...user,
            // We use a temporary field 'displayRole' in the form data context if needed, 
            // but here we just set the component state variables or handle it in the render.
            // Actually, let's just use the existing fields and map them in the UI.
        });
        // We'll use a local state for the select to simplify mapping
        setRoleSelection(displayRole);
        setIsModalOpen(true);
    };

    const [roleSelection, setRoleSelection] = useState('user');

    const handleSave = async () => {
        if (!editingUser) return;

        // Map Display Role back to DB fields
        let dbRole = 'user';
        let dbArtistType = 'none';

        switch (roleSelection) {
            case 'admin':
                dbRole = 'admin';
                dbArtistType = 'none';
                break;
            case 'artist':
                dbRole = 'artist';
                dbArtistType = 'artist';
                break;
            case 'label':
                dbRole = 'artist';
                dbArtistType = 'label';
                break;
            default: // user
                dbRole = 'user';
                dbArtistType = 'none';
        }

        try {
            // Use the RPC function to bypass any RLS issues for admin updates
            const { error } = await supabase.rpc('update_user_role', {
                target_user_id: editingUser.id,
                new_role: dbRole,
                new_artist_type: dbArtistType,
                new_status: formData.status || 'active',
                new_username: formData.username,
                new_full_name: formData.full_name
            });

            if (error) throw error;

            // Refresh data from server to ensure we have the latest state
            await fetchUsers();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert(`Error updating user: ${error.message || 'Unknown error'}`);
        }
    };

    const toggleBan = async (user: Profile) => {
        const newStatus = user.status === 'banned' ? 'active' : 'banned';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);

            if (error) throw error;

            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (error) {
            console.error('Error toggling ban:', error);
        }
    };

    const deleteUser = async (user: Profile) => {
        if (!window.confirm(`Are you sure you want to permanently delete user ${user.full_name}? This will only remove their LISNET profile, not their Telegram record.`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== user.id));
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Error deleting user: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">User Management</h2>

            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-[#B3B3B3]" />
                    </div>
                    <Input
                        className="pl-10 bg-[#282828] border-none text-white focus:ring-1 focus:ring-[#1DB954]"
                        placeholder="Search by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    variant="ghost"
                    onClick={fetchUsers}
                    className="text-[#B3B3B3] hover:text-[#1DB954]"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
            </div>

            <div className="rounded-md border border-white/10 bg-[#121212] overflow-hidden">
                {loading && (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" />
                    </div>
                )}

                {!loading && (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-[#B3B3B3]">User</TableHead>
                                <TableHead className="text-[#B3B3B3]">Telegram ID</TableHead>
                                <TableHead className="text-[#B3B3B3]">Role</TableHead>
                                <TableHead className="text-[#B3B3B3]">Status</TableHead>
                                <TableHead className="text-[#B3B3B3]">Joined</TableHead>
                                <TableHead className="text-right text-[#B3B3B3]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-[#B3B3B3]">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt={user.username} className="w-8 h-8 rounded-full bg-[#282828] object-cover" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{user.full_name}</span>
                                                    <span className="text-[10px] text-[#B3B3B3]">@{user.username || 'no_username'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[#B3B3B3] font-mono text-xs">{user.telegram_id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className={`border-${user.role === 'admin' ? 'red' : user.role === 'artist' ? 'purple' : 'blue'}-500 text-white uppercase text-[9px] font-black w-fit`}>
                                                    {user.role === 'artist' && user.artist_type === 'label' ? 'LABEL' : user.role}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={user.status === 'active' || !user.status ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}>
                                                {user.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[#B3B3B3] text-xs">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#B3B3B3] hover:text-white hover:bg-white/10" onClick={() => handleEdit(user)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => deleteUser(user)}
                                                    title="Delete user profile"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`h-8 w-8 ${user.status === 'banned' ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'} hover:bg-white/10`}
                                                    onClick={() => toggleBan(user)}
                                                >
                                                    {user.status === 'banned' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Edit Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#181818] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative">
                        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Edit Profile</h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-[#B3B3B3] mb-1.5 uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.full_name || ''}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-[#282828] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954] border border-white/5 transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#B3B3B3] mb-1.5 uppercase tracking-wider">Telegram Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B3B3B3] text-sm">@</span>
                                    <input
                                        type="text"
                                        value={formData.username || ''}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-[#282828] text-white rounded-lg p-3 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954] border border-white/5 transition-all"
                                        placeholder="username"
                                    />
                                </div>
                                <p className="text-[10px] text-amber-500 mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>
                                    Must exactly match the user's Telegram username.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#B3B3B3] mb-1.5 uppercase tracking-wider">Account Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['user', 'artist', 'label', 'admin'] as const).map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setRoleSelection(role)}
                                            className={`p-3 rounded-lg text-sm font-bold border transition-all duration-200 capitalize
                                                ${roleSelection === role
                                                    ? 'bg-[#1DB954] text-black border-[#1DB954] shadow-[0_0_15px_rgba(29,185,84,0.3)]'
                                                    : 'bg-[#282828] text-[#B3B3B3] border-transparent hover:bg-[#333] hover:text-white'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#B3B3B3] mt-2 leading-relaxed">
                                    {roleSelection === 'user' && "Regular user. Can listen to music."}
                                    {roleSelection === 'artist' && "Individual artist. Can upload music and manage profile."}
                                    {roleSelection === 'label' && "Record label. Can manage multiple artists or releases."}
                                    {roleSelection === 'admin' && "Full system access."}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#B3B3B3] hover:text-white hover:bg-white/10 rounded-full">Cancel</Button>
                            <Button onClick={handleSave} className="bg-[#1DB954] text-black hover:bg-[#1ed760] font-bold rounded-full px-6">Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
