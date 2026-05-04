import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f1419",
          card: "#161d27",
          border: "#243044",
        },
        accent: {
          DEFAULT: "#3b82f6",
          muted: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
