/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131417',
          raised: '#1a1b1f',
          border: '#2a2b30',
          muted: '#8b8d97',
        },
        trust: {
          verified: '#4ADE80',
          amber: '#FBBF24',
          error: '#F87171',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(74, 222, 128, 0.15)',
        'glow-amber': '0 0 40px rgba(251, 191, 36, 0.15)',
        'glow-voice': '0 0 60px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
};
