import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * Tailwind v4 primarily uses CSS-first config in src/styles/index.css.
 * This file remains for tooling / content scanning compatibility.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0A2540",
          orange: "#FF6B00",
          slate: "#f8fafc",
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
