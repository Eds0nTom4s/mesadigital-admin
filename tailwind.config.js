/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F2994A',
        background: '#F7F7F7',
        card: '#FFFFFF',
        'text-primary': '#333333',
        'text-secondary': '#555555',
        border: '#E0E0E0',
        success: '#27AE60',
        warning: '#F2C94C',
        error: '#EB5757',
        info: '#2F80ED',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
