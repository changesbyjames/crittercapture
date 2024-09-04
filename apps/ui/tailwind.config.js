const theme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html', './node_modules/@critter/react/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', ...theme.fontFamily.sans]
      },

      colors: {
        accent: {
          50: 'rgba(var(--accent-color-50) / <alpha-value>)',
          100: 'rgba(var(--accent-color-100) / <alpha-value>)',
          200: 'rgba(var(--accent-color-200) / <alpha-value>)',
          300: 'rgba(var(--accent-color-300) / <alpha-value>)',
          400: 'rgba(var(--accent-color-400) / <alpha-value>)',
          500: 'rgba(var(--accent-color-500) / <alpha-value>)',
          600: 'rgba(var(--accent-color-600) / <alpha-value>)',
          700: 'rgba(var(--accent-color-700) / <alpha-value>)',
          800: 'rgba(var(--accent-color-800) / <alpha-value>)',
          900: 'rgba(var(--accent-color-900) / <alpha-value>)',
          950: 'rgba(var(--accent-color-950) / <alpha-value>)'
        }
      }
    }
  },
  plugins: [require('tailwind-scrollbar'), require('@tailwindcss/typography')]
};
