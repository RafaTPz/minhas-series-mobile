/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#101412",
        panel: "#1b221e",
        accent: "#c5f277",
        muted: "#9eaaa2",
      },
    },
  },
  plugins: [],
};
