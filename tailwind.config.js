/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cabinet Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Cabinet Grotesk"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0b",
          2: "#e7e7ea",
        },
        cinema: {
          bg: "#060608",
          panel: "#0e0e12",
          line: "#232329",
        },
        gold: {
          DEFAULT: "#c9a24b",
          soft: "#e4c983",
        },
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      transitionTimingFunction: {
        cine: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
