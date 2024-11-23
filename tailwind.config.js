/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{tsx,jsx,js,ts}"],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
} 