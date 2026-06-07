/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f4ff',
          100: '#cce8ff',
          200: '#99d1ff',
          300: '#66baff',
          400: '#38b6ff',
          500: '#0099ee',
          600: '#0066ff',
          700: '#0044cc',
          800: '#003399',
          900: '#002266',
          950: '#001133',
        },
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
