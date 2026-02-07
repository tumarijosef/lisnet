import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';

// Accessing window.Telegram
declare global {
    interface Window {
        Telegram: {
            WebApp: any;
        };
    }
}

export const useTelegram = () => {
    const { profile, setProfile, setLoading } = useAuthStore();
    const { fetchLibrary } = useLibraryStore();

    useEffect(() => {
        const tg = window.Telegram?.WebApp;

        // If we are NOT in Telegram WebApp
        if (!tg || !tg.initData) {
            // Already have a profile from persistence?
            if (profile) {
                fetchLibrary(profile.id);
            }
            setLoading(false);
            return;
        }

        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;

        if (tgUser) {
            const syncUser = async () => {
                try {
                    setLoading(true);

                    // Use the SECURITY DEFINER function to register or login the user
                    // This bypasses RLS issues for new users
                    const { data: userProfile, error } = await supabase.rpc('register_telegram_user', {
                        p_telegram_id: tgUser.id,
                        p_username: tgUser.username || '',
                        p_full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                        p_avatar_url: tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.username || tgUser.first_name}&background=random`
                    });

                    if (error) {
                        console.error('Error registering telegram user:', error);
                        // Fallback: try direct select if RPC fails (though RPC is preferred)
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('telegram_id', tgUser.id)
                            .single();

                        if (existingProfile) {
                            setProfile(existingProfile);
                            await fetchLibrary(existingProfile.id);
                        }
                        return;
                    }

                    if (userProfile) {
                        setProfile(userProfile);
                        await fetchLibrary(userProfile.id);
                    }

                } catch (error) {
                    console.error('Error syncing Telegram user:', error);
                } finally {
                    setLoading(false);
                }
            };

            syncUser();
        } else {
            setLoading(false);
        }
    }, [setProfile, setLoading, fetchLibrary]);

    return {
        tg: window.Telegram?.WebApp,
        user: window.Telegram?.WebApp?.initDataUnsafe?.user,
    };
};
