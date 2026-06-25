/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        panda: {
          red: '#C8102E',
          dark: '#1a1a2e',
          gray: '#2d2d44',
        },
      },
    },
  },
  plugins: [],
}

