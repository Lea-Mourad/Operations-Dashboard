import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/frontend/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/frontend/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/frontend/lib/**/*.{js,ts,jsx,tsx}",
    "./src/frontend/types/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#F2F4F7",
        signal: "#0F766E",
        warning: "#B54708",
      },
    },
  },
  plugins: [],
};

export default config;
