/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rlkBlue: "#1f4bb8",
        rlkBlueDark: "#14357d",
        rlkYellow: "#f7c600",
        rlkYellowDark: "#d6aa00",
      },
    },
  },
  plugins: [],
};