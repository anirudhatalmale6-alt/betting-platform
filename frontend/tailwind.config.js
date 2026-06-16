/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#e11d48', 600: '#be123c', 700: '#9f1239', 800: '#881337', 900: '#4c0519' },
        dark: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
        surface: { light: '#dde2e8', DEFAULT: '#c8cfd8', dark: '#b8c1cc' },
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
