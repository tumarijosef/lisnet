import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useLibraryStore } from '../store/useLibraryStore';

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

        if (!tg || !tg.initData) {
            if (profile) fetchLibrary(profile.id);
            setLoading(false);
            return;
        }

        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param || "";

        if (tgUser) {
            const syncUser = async () => {
                try {
                    setLoading(true);

                    // 1. WEB AUTH CONFIRMATION
                    if (startParam && startParam.startsWith('auth_')) {
                        const sessionId = startParam.replace('auth_', '');
                        console.log('Detected auth request for session:', sessionId);

                        const { data: updateData, error: updateError } = await supabase
                            .from('web_auth_sessions')
                            .update({
                                status: 'confirmed',
                                telegram_id: tgUser.id,
                                user_data: {
                                    id: tgUser.id,
                                    username: tgUser.username,
                                    first_name: tgUser.first_name,
                                    last_name: tgUser.last_name,
                                    photo_url: tgUser.photo_url
                                }
                            })
                            .eq('id', sessionId)
                            .select();

                        if (updateError) {
                            console.error('Database update error:', updateError);
                            tg.showAlert('DB Error: ' + updateError.message);
                        } else if (!updateData || updateData.length === 0) {
                            console.error('Session not found in DB');
                            tg.showAlert('Error: Session not found. Refresh the login page on your computer.');
                        } else {
                            console.log('Web auth confirmed successfully!');
                            tg.HapticFeedback.notificationOccurred('success');
                            tg.showAlert('Login Confirmed! You can now return to the browser on your computer.');
                        }
                    }

                    // 2. STANDARD APP SYNC
                    const { data: userProfile, error } = await supabase.rpc('register_telegram_user', {
                        p_telegram_id: tgUser.id,
                        p_username: tgUser.username || '',
                        p_full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
                        p_avatar_url: tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.username || tgUser.first_name}&background=random`
                    });

                    if (userProfile) {
                        setProfile(userProfile);
                        await fetchLibrary(userProfile.id);
                    } else if (error) {
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('telegram_id', tgUser.id)
                            .single();
                        if (existingProfile) {
                            setProfile(existingProfile);
                            await fetchLibrary(existingProfile.id);
                        }
                    }

                } catch (error: any) {
                    console.error('Critical sync error:', error);
                    tg.showAlert('System Error: ' + (error.message || 'Unknown error'));
                } finally {
                    setLoading(false);
                }
            };

            syncUser();
        } else {
            console.warn('Telegram user data missing');
            setLoading(false);
        }
    }, [setProfile, setLoading, fetchLibrary]);

    return {
        tg: window.Telegram?.WebApp,
        user: window.Telegram?.WebApp?.initDataUnsafe?.user,
    };
};
