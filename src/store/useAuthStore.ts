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
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
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
