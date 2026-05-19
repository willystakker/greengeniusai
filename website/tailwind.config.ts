import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        genius: {
          black: "#050A05",
          dark: "#0A120A",
          card: "#0F1A0F",
          border: "#1A2E1A",
          green: "#00FF41",
          emerald: "#00D97E",
          lime: "#7FFF00",
          gold: "#FFD700",
          muted: "#4A7A4A",
          text: "#B8D4B8",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "genius-gradient": "linear-gradient(135deg, #050A05 0%, #0A1F0A 50%, #050A05 100%)",
        "card-gradient": "linear-gradient(145deg, #0F1A0F, #0A120A)",
        "green-glow": "radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, transparent 70%)",
        "gold-glow": "radial-gradient(ellipse at center, rgba(255,215,0,0.1) 0%, transparent 70%)",
      },
      animation: {
        "pulse-green": "pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ticker": "ticker 30s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 255, 65, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(0, 255, 65, 0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { textShadow: "0 0 10px rgba(0,255,65,0.5)" },
          "100%": { textShadow: "0 0 20px rgba(0,255,65,0.9), 0 0 40px rgba(0,255,65,0.4)" },
        },
      },
      boxShadow: {
        "genius": "0 0 30px rgba(0, 255, 65, 0.1), 0 0 60px rgba(0, 255, 65, 0.05)",
        "genius-strong": "0 0 40px rgba(0, 255, 65, 0.2), inset 0 1px 0 rgba(0, 255, 65, 0.1)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(0, 255, 65, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
