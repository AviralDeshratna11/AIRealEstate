import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f5f6f8",
        brass: "#a8813c",
        coral: "#d6532c",
        peacock: "#006d77",
        // Shared platform palette — used across every portal/tab.
        ivory: "#ffffff",
        sand: "#f3f4f6",
        espresso: "#0f172a",
        // Primary brand accent (was gold — now a professional blue, matching the
        // Radar module's existing connectivity blue for visual consistency).
        gold: "#2563eb",
        goldsoft: "#60a5fa",
        // Original warm gold, preserved for sparing secondary/premium use
        // (e.g. a "featured listing" ribbon) since it's demoted, not deleted.
        premium: "#a8813c",
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
        // Repointed to the body sans stack — no more serif display font.
        display: ["var(--font-body)", "ui-sans-serif", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 50px rgba(17, 24, 39, 0.10)",
        // Was a hard 8px offset "sticker" shadow — now a soft diffuse shadow like everything else.
        crisp: "0 10px 30px rgba(17, 24, 39, 0.12)",
        // Primary card/panel lift shadow.
        lx: "0 12px 32px rgba(17, 24, 39, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
