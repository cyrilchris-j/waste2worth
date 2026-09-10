/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyril's brand green palette (Master Design System)
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Primary brand
          700: '#15803d', // Primary dark / hover
          800: '#166534',
          900: '#14532d',
        },
        // Semantic aliases
        primary: {
          DEFAULT: '#16a34a',
          hover: '#15803d',
          light: '#f0fdf4',
        },
        // Legacy token mappings to Cyril's master palette to prevent breaks
        ink:   '#111827', // mapped to gray-900
        moss:  '#15803d', // mapped to brand-700
        leaf:  '#dcfce7', // mapped to brand-100
        cream: '#f9fafb', // mapped to gray-50
        rust:  '#dc2626', // mapped to red-600
        mist:  '#f3f4f6', // mapped to gray-100
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
