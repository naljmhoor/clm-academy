/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0a0a0a', soft: '#404040', muted: '#737373', faint: '#a3a3a3' },
        line: { DEFAULT: '#e5e5e5', soft: '#f0f0f0' },
        surface: { DEFAULT: '#ffffff', sunken: '#f5f5f5', rail: '#fafafa' },
        academy: { DEFAULT: '#4338ca', soft: '#eef2ff' },
      },
      fontSize: { '2xs': ['11px', '16px'] },
      boxShadow: { pop: '0 4px 16px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.06)' },
    },
  },
  plugins: [],
};
