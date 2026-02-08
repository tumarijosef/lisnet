import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '../types';

interface AuthState {
    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    webAuthConfirmed: boolean;
    setWebAuthConfirmed: (confirmed: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'lisnet-auth-storage',
            partialize: (state) => ({ profile: state.profile }),
        }
    )
);
