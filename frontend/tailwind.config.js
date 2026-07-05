/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#f7f8fa',
        accent: '#2f80ed',
        'accent-dark': '#1f6ed4',
        sky: '#56a4ff',
        surface: '#ffffff',
        ink: '#15171a',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 4px 16px rgba(20, 24, 32, 0.045)',
        float: '0 24px 70px rgba(20, 24, 32, 0.18)',
      },
      fontFamily: {
        sans: ['Segoe UI Variable', 'Aptos', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
