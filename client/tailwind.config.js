/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15132C",
        "ink-soft": "#4A4768",
        paper: "#EFEAE0",
        "paper-dim": "#E3DDCE",
        gold: "#B8863B",
        violet: "#5B4FCF",
        midnight: "#07040F",
        "midnight-soft": "#0D0920",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Fraunces", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        prose: "68ch",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(90deg, #7C3AED 0%, #D946EF 50%, #3B82F6 100%)",
      },
      boxShadow: {
        glow: "0 0 50px -12px rgba(168, 85, 247, 0.55)",
      },
    },
  },
  plugins: [],
};