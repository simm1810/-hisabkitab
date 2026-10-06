/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#effcfa',
          100: '#c6f5ee',
          200: '#8ee8dc',
          300: '#54d3c5',
          400: '#2bb5aa',
          500: '#149a8f',
          600: '#0f766e', // primary
          700: '#0d5f59',
          800: '#0e4c48',
          900: '#0f3f3c',
        },
        cream: {
          50: '#fffdf9',
          100: '#fef8ee',
          200: '#fdefd8',
        },
        saffron: {
          400: '#ff9d4d',
          500: '#f97316', // orange accent
          600: '#ea5f0a',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(15, 118, 110, 0.08)',
        cardHover: '0 8px 24px rgba(15, 118, 110, 0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
