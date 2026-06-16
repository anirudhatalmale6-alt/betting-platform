/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#fffdf0', 100: '#fff9cc', 200: '#fff199', 300: '#ffe866', 400: '#ffd700', 500: '#d4a600', 600: '#aa8500', 700: '#806300', 800: '#554200', 900: '#2b2100' },
        dark: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#2d3748', 800: '#1a2332', 900: '#0d1520', 950: '#070d14' },
        back: { light: '#a8d8ff', DEFAULT: '#72bbef', dark: '#3b9ad9' },
        lay: { light: '#f8c8d0', DEFAULT: '#f994a8', dark: '#e8687f' },
        accent: { green: '#00c853', red: '#ff1744', gold: '#ffd700', orange: '#ff6d00' },
        success: '#00c853',
        danger: '#ff1744',
        warning: '#ffd700'
      }
    }
  },
  plugins: []
}
