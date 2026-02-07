import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Profile } from '../types';

interface UserSearchSelectProps {
    onSelect: (user: Profile) => void;
    selectedUsers?: Profile[];
    placeholder?: string;
    className?: string;
}

const UserSearchSelect = ({ onSelect, placeholder = "Search artist...", className }: UserSearchSelectProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('full_name', `%${query}%`)
                    .limit(5);

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchUsers, 500);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-8 h-8 text-xs bg-[#121212] border-white/10"
                />
                {loading && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
                )}
            </div>

            {isOpen && query.trim().length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-[#181818] border border-white/10 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-[#B3B3B3] flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs">Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => {
                                    onSelect(user);
                                    setQuery('');
                                    setIsOpen(false);
                                }}
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.avatar_url || ''} />
                                    <AvatarFallback><User size={12} /></AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-white truncate">{user.full_name}</span>
                                    {user.username && <span className="text-xs text-muted-foreground truncate">@{user.username}</span>}
                                </div>
                                {user.artist_type !== 'none' && (
                                    <div className="ml-auto">
                                        <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                            Artist
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-center text-[#B3B3B3] text-xs">
                            No artists found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSearchSelect;
