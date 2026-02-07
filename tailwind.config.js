/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                tg: {
                    bg: 'var(--spotify-bg, #121212)',
                    text: 'var(--spotify-text-primary, #ffffff)',
                    hint: 'var(--spotify-text-secondary, #b3b3b3)',
                    link: 'var(--tg-theme-link-color, #2481cc)',
                    button: 'var(--spotify-green, #1db954)',
                    'button-text': 'var(--tg-theme-button-text-color, #000000)',
                    secondary: 'var(--spotify-card, #181818)',
                    header: 'var(--tg-theme-header-bg-color, #121212)',
                    accent: 'var(--tg-theme-accent-text-color, #1db954)',
                    section: 'var(--tg-theme-section-bg-color, #121212)',
                    'section-header': 'var(--tg-theme-section-header-text-color, #1db954)',
                    subtitle: 'var(--tg-theme-subtitle-text-color, #b3b3b3)',
                    destructive: 'var(--tg-theme-destructive-text-color, #ff3b30)',
                },
                spotify: {
                    bg: '#121212',
                    card: '#181818',
                    hover: '#282828',
                    green: '#1db954',
                    bright: '#1ed760',
                    text: {
                        primary: '#ffffff',
                        secondary: '#b3b3b3'
                    }
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}
