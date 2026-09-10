/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#14231d', moss: '#1f6f52', leaf: '#dff4e6', cream: '#f7f4ed', rust: '#bc5b32', mist: '#e8eee9' }
    }
  },
  plugins: []
}
