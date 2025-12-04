/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5EFEA",
        "text-main": "#605652",
        "text-sub": "#9E948F",
        "glass-border": "rgba(255, 255, 255, 0.7)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        neu: "8px 8px 16px rgba(188, 175, 166, 0.45), -8px -8px 16px rgba(255, 255, 255, 0.8)",
        "neu-pressed": "inset 4px 4px 8px rgba(188, 175, 166, 0.45), inset -4px -4px 8px rgba(255, 255, 255, 0.9)",
        "neu-border": "inset 2px 2px 5px rgba(255, 255, 255, 0.7), inset -3px -3px 7px rgba(206, 195, 186, 0.25)",
      },
    },
  },
  plugins: [],
}