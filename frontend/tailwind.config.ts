import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191713",
        paper: "#f4efe3",
        brass: "#b8832f",
        coral: "#d6532c",
        peacock: "#006d77",
        estate: {
          50: "#eef8f6",
          100: "#d6ece8",
          500: "#008f82",
          700: "#006d77",
          900: "#12333a"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "serif"]
      },
      boxShadow: {
        soft: "0 22px 60px rgba(25, 23, 19, 0.13)",
        crisp: "8px 8px 0 rgba(25, 23, 19, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
