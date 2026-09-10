/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17342a',
        forest: '#16794c',
        'forest-dark': '#0e5c3a',
        mint: '#e8f5ee',
        sand: '#f7faf8'
      },
      boxShadow: {
        card: '0 5px 18px rgba(23, 52, 42, 0.06)'
      }
    }
  },
  plugins: []
}
