import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      colors: {
        brand: {
          50: "hsl(222, 100%, 97%)",
          100: "hsl(222, 96%, 93%)",
          200: "hsl(222, 94%, 85%)",
          300: "hsl(222, 92%, 74%)",
          400: "hsl(222, 89%, 61%)",
          500: "hsl(222, 87%, 48%)",
          600: "hsl(222, 88%, 40%)",
          700: "hsl(222, 85%, 33%)",
          800: "hsl(222, 78%, 27%)",
          900: "hsl(222, 73%, 22%)",
          950: "hsl(222, 70%, 14%)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
