/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#050505",
        card: "#0a0a0a",
        accent: "#ffffff", // Pure white for high-end contrast
        muted: "#555555",
        brand: "#f5f5f7", // Sophisticated warm white
      },
      fontFamily: {
        sans: [
          "Outfit",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Syne", "sans-serif"],
        hero: ["Fraunces", "Georgia", "serif"],
      },
      keyframes: {
        "move-background": {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(1000px, 0, 0)" },
        },
      },
      animation: {
        "move-background": "move-background 45s linear infinite",
        "move-background-slow": "move-background 120s linear infinite",
      },
    },
  },
  plugins: [],
};
