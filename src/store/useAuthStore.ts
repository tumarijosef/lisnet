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
                try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();

                    if (userError || !user) {
                        console.log('Refresh: No active session found or error occurred');
                        return;
                    }

                    if (user) {
                        // Try to get profile
                        let { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', user.id)
                            .single();

                        // If not found, wait a bit for trigger and try once more
                        if (!profile) {
                            console.log('Profile not found, waiting for trigger...');
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            const { data: retryProfile } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', user.id)
                                .single();
                            profile = retryProfile;
                        }

                        // If still not found, create a basic one manually (fallback)
                        if (!profile) {
                            console.log('Creating fallback profile for:', user.id);
                            const { data: newProfile, error: insertError } = await supabase
                                .from('profiles')
                                .insert({
                                    id: user.id,
                                    username: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0],
                                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                                    avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`,
                                    role: 'user',
                                    status: 'active',
                                    created_at: new Date().toISOString()
                                })
                                .select()
                                .single();

                            if (insertError) {
                                console.error('Fallback creation failed:', insertError);
                            }
                            profile = newProfile;
                        }

                        if (profile) {
                            set({ profile });
                            localStorage.removeItem('lisnet_auth_error');
                        }
                    }
                } catch (err: any) {
                    console.error('refreshProfile major error:', err);
                    localStorage.setItem('lisnet_auth_error', err.message);
                }
            }
        }),
        {
            name: 'lisnet-auth-storage',
            partialize: (state) => ({ profile: state.profile }),
        }
    )
);
