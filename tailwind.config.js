export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#131318', // Custom dark background
          800: '#1a1a1f', // Slightly lighter for cards/panels
          700: '#2a2a30', // For borders and subtle elements
        }
      },
    },
  },
  plugins: [],
}