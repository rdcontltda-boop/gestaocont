/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd1ff',
          300: '#8eb3ff',
          400: '#5988ff',
          500: '#335dff',
          600: '#1d3bf5',
          700: '#162ce1',
          800: '#1826b6',
          900: '#1a278f',
        },
      },
    },
  },
  plugins: [],
}
