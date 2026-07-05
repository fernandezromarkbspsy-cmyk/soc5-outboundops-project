/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#292929',
        accent: '#2f6f6a',
        'accent-dark': '#245a56',
        lime: '#d9ec32',
        surface: '#f4f4f3',
        ink: '#172033',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 18px 45px rgba(31, 41, 55, 0.07)',
        float: '0 24px 70px rgba(15, 23, 42, 0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
