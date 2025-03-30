/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f4ff',
          100: '#e9eaff',
          200: '#d6d8ff',
          300: '#b8baff',
          400: '#9592ff',
          500: '#786bff',
          600: '#6344ff',
          700: '#5631ef',
          800: '#4725d0',
          900: '#3a21aa',
          950: '#231270',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 