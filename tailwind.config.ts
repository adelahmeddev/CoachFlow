import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light‑mode palette – replace ultra‑bright defaults
        light: {
          bg: "#fafafa",            // main page background
          surface: "#ffffff",        // cards, panels
          primary: "#2563eb",        // brand accent (keep existing hue)
          primaryHover: "#1d4ed8",
          muted: "#e5e7eb",          // light borders / separators
          text: "#111827",          // high‑contrast dark text
          subtle: "#6b7280",        // secondary text, placeholders
        },
      },
    },
  },
  plugins: [
    function ({ addBase }: { addBase: any }) {
      addBase({
        ":root": {
          "--color-bg": "var(--color-light-bg)",
          "--color-surface": "var(--color-light-surface)",
          "--color-primary": "var(--color-light-primary)",
          "--color-text": "var(--color-light-text)",
        },
        "[data-theme='light']": {
          "--color-light-bg": "#fafafa",
          "--color-light-surface": "#ffffff",
          "--color-light-primary": "#2563eb",
          "--color-light-text": "#111827",
        },
      });
    },
  ],
};

export default config;
