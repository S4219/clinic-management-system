/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fd',
          300: '#93d1fc',
          400: '#60b5f8',
          500: '#3b96f5',
          600: '#2578ea',
          700: '#1d62d7',
          800: '#1e4fae',
          900: '#1e4589',
        },
      },
    },
  },
  plugins: [],
}

