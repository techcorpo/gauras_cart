/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables so the color theme can change at runtime.
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          deep: 'var(--brand-deep)',
          light: 'var(--brand-light)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
