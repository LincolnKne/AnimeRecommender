/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        regal: {
          light: "#9E72C3",
          medium: "#924DBF",
          mid: "#7338A0",
          dark: "#4A2574",
          darker: "#0F0529",
        },
      },
    },
  },
   plugins: [require('@tailwindcss/line-clamp')],
};
