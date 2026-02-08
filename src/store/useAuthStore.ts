import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    webAuthConfirmed: boolean;
    setWebAuthConfirmed: (confirmed: boolean) => void;
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            profile: null,
            setProfile: (profile) => set({ profile }),
            loading: true,
            setLoading: (loading) => set({ loading }),
            logout: () => {
                set({ profile: null });
                localStorage.removeItem('lisnet-auth-storage');
            },
            webAuthConfirmed: false,
            setWebAuthConfirmed: (confirmed) => set({ webAuthConfirmed: confirmed }),
            refreshProfile: async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Try to get profile
                    let { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    // If not found, wait a bit for trigger and try once more
                    if (!profile) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        const { data: retryProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', user.id)
                            .single();
                        profile = retryProfile;
                    }

                    // If still not found, create a basic one manually (fallback)
                    if (!profile) {
                        const { data: newProfile } = await supabase
                            .from('profiles')
                            .insert({
                                id: user.id,
                                username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0],
                                full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                                avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`,
                                role: 'user',
                                status: 'active'
                            })
                            .select()
                            .single();
                        profile = newProfile;
                    }

                    if (profile) set({ profile });
                }
            }
        }),
        {
            name: 'lisnet-auth-storage',
            partialize: (state) => ({ profile: state.profile }),
        }
    )
);
