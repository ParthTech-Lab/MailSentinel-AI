/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0a0f1d',
          850: '#0f172a',
          800: '#141e33',
          700: '#1e293b',
          600: '#334155',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        threat: {
          safe: '#10b981',
          spam: '#f59e0b',
          phishing: '#ef4444',
          suspicious: '#f97316',
        }
      },
    },
  },
  plugins: [],
}

