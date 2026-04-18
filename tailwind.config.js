/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        healthy: { DEFAULT: '#16a34a', soft: '#dcfce7', softDark: '#052e16' },
        caution: { DEFAULT: '#ca8a04', soft: '#fef3c7', softDark: '#451a03' },
        danger: { DEFAULT: '#dc2626', soft: '#fee2e2', softDark: '#450a0a' },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
