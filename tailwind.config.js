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
        "primary": "#006948", // Primary Emerald
        "primary-container": "#9df3cc",
        "on-primary": "#ffffff",
        "on-primary-container": "#002114",
        
        "tertiary": "#8d4b00", // Tertiary Amber
        "tertiary-container": "#ffdcc1",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#2d1600",
        
        "secondary": "#facc15",
        "secondary-container": "#fef08a",
        "on-secondary": "#1a1917",
        "on-secondary-container": "#713f12",
        
        "error": "#ba1a1a", // Error Crimson
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#410002",
        
        "surface": "#faf8ff", // Surface
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f9",
        "surface-container": "#eceee8",
        "surface-container-high": "#e7e9e3",
        "on-surface": "#191c1b",
        "on-surface-variant": "#404944",
        
        "outline": "#707973",
        "outline-variant": "#bfc9c2",
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
