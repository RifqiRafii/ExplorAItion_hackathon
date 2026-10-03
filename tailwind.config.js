/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#1a5c50",
        "primary-container": "#2a7d6e",
        "on-primary": "#ffffff",
        "on-primary-container": "#e6f3f0",
        "secondary": "#facc15",
        "secondary-container": "#fef08a",
        "on-secondary": "#1a1917",
        "on-secondary-container": "#713f12",
        "error": "#dc2626",
        "error-container": "#fef2f2",
        "on-error": "#ffffff",
        "on-error-container": "#991b1b",
        "surface": "#faf8f4",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f0e6",
        "surface-container": "#e2dbd0",
        "surface-container-high": "#d6cec1",
        "on-surface": "#1a1917",
        "on-surface-variant": "#6b6862",
        "outline": "#e2dbd0",
        "outline-variant": "#d6cec1",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        display: ["var(--font-plus-jakarta-sans)", "serif"], // We'll just use the same sans but bold for display for consistency unless adding another font
      },
      animation: {
        'marquee-loop': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
