/** @type {import('tailwindcss').Config} */
// Bazaaro design system (Option A: saaf aur taaza).
// Rang yahin se badlte hain. Components mein hex likhne ke bajaye in naamon ko use karo:
//   brand-*   gehra hara  (800 = #1B4332 main, 700 = #2D6A4F hover/links)
//   accent-*  orange      (400 = #F4A261 sirf sale badge aur khaas buttons ke liye)
//   ink-*     text rang   (ink = body, ink-soft = doosra text, ink-faint = hints)
//   line      border rang
//   surface   halka hara-grey background
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F2FAF5',
          100: '#D8F3DC',
          200: '#B7E4C7',
          300: '#95D5B2',
          400: '#74C69D',
          500: '#52B788',
          600: '#40916C',
          700: '#2D6A4F',
          800: '#1B4332',
          900: '#12301F',
          950: '#081C15',
        },
        accent: {
          50:  '#FEF4EC',
          100: '#FDE6D2',
          200: '#FBCDA5',
          300: '#F8B87F',
          400: '#F4A261',
          500: '#E98A3E',
          600: '#D4702A',
          700: '#A8561F',
        },
        ink: {
          DEFAULT: '#14221B',
          soft:    '#4B5B52',
          faint:   '#74847B',
        },
        line:    '#E3E9E5',
        surface: '#F6F8F6',
      },
      fontFamily: {
        sans: [
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 34, 27, 0.05), 0 4px 12px rgba(20, 34, 27, 0.04)',
        pop:  '0 8px 24px rgba(20, 34, 27, 0.12), 0 2px 6px rgba(20, 34, 27, 0.06)',
      },
    },
  },
  plugins: [],
}
