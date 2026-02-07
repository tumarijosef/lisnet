import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '../types';

interface AuthState {
    profile: Profile | null;
    setProfile: (profile: Profile | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    logout: () => void;
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
        }),
        {
            name: 'lisnet-auth-storage',
            partialize: (state) => ({ profile: state.profile }),
        }
    )
);
