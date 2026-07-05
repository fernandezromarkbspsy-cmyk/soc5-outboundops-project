/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#101936',
        accent: '#4f46e5',
        'accent-dark': '#3730a3',
        sky: '#0ea5e9',
        surface: '#f3f6fb',
        ink: '#14213d',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 8px 30px rgba(19, 35, 72, 0.07)',
        float: '0 24px 70px rgba(10, 18, 40, 0.20)',
      },
      fontFamily: {
        sans: ['Segoe UI Variable', 'Aptos', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
