import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// import { WebApp } from '@telegram-apps/sdk' // Removed due to import error

// Initialize Telegram SDK
const initTelegramSDK = () => {
    try {
        // Define WebApp from window
        const WebApp = (window as any).Telegram?.WebApp;

        // Check if we are inside Telegram environment
        if (typeof window !== 'undefined' && WebApp) {
            WebApp.ready();
            WebApp.expand();
            WebApp.setHeaderColor('#121212'); // Set explicit header color
            WebApp.setBackgroundColor('#121212'); // Set explicit background color

            // Set theme colors - FORCE DARK MODE (Spotify Style)
            try {
                // We ignore WebApp.themeParams to enforce the app's specific dark design
                document.documentElement.style.setProperty('--tg-theme-bg-color', '#121212');
                document.documentElement.style.setProperty('--tg-theme-text-color', '#FFFFFF');
                document.documentElement.style.setProperty('--tg-theme-hint-color', '#B3B3B3');
                document.documentElement.style.setProperty('--tg-theme-link-color', '#1DB954');
                document.documentElement.style.setProperty('--tg-theme-button-color', '#1DB954');
                document.documentElement.style.setProperty('--tg-theme-button-text-color', '#000000');
                document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', '#181818');
            } catch (e) {
                console.error('Error setting theme params:', e);
            }
        } else {
            console.warn('Telegram WebApp is not detected. Using fallback theme.');
            // Fallback theme for browser development
            document.documentElement.style.setProperty('--tg-theme-bg-color', '#121212');
            document.documentElement.style.setProperty('--tg-theme-text-color', '#FFFFFF');
            document.documentElement.style.setProperty('--tg-theme-hint-color', '#B3B3B3');
            document.documentElement.style.setProperty('--tg-theme-link-color', '#1DB954');
            document.documentElement.style.setProperty('--tg-theme-button-color', '#1DB954');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', '#000000');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', '#181818');
        }
    } catch (e) {
        console.error('Error during Telegram SDK initialization:', e);
    }
};

initTelegramSDK();

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>,
    );
} catch (error: any) {
    console.error('Render error:', error);
    document.getElementById('root')!.innerHTML = `
        <div style="padding: 20px; color: white; background: #121212; height: 100vh;">
            <h1 style="color: #ff4444;">Render Error</h1>
            <pre style="white-space: pre-wrap; word-break: break-all;">${error?.message || 'Unknown error'}</pre>
            <pre style="font-size: 10px; opacity: 0.5;">${error?.stack || ''}</pre>
        </div>
    `;
}

