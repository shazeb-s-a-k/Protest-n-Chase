/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        protest: {
          pink: '#ff007a',
          cyan: '#00f0ff',
          purple: '#7928ca',
        },
        police: {
          navy: '#1e3a8a',
          blue: '#3b82f6',
          gold: '#facc15',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      }
    },
  },
  plugins: [],
}
