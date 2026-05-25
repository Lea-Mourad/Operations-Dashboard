import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
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
