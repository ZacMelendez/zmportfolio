/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          400: "#94a77a",
          500: "#7f886a",
          600: "#5c6349",
        },
      },
    },
  },
  plugins: [],
}

