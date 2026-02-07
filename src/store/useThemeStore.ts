import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'original' | 'skynet';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'original',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'lisnet-theme',
        }
    )
);
