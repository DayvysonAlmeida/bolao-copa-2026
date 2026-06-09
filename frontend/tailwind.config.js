/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#121214',
          800: '#202024',
          700: '#29292e',
        },
        neon: {
          green: '#04d361',
        }
      }
    },
  },
  plugins: [],
}