/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep Forest / Spruce Green Theme matching portal-property.netlify.app
          sidebar: "#10261a",
          sidebarHover: "#163825",
          content: "#ffffff",
          canvas: "#fcfcfc",
          bgLight: "#f7f7f7",
          border: "#dedede",
          borderLight: "#eeeeee",
          borderStrong: "#c4c4c4",
          primary: "#10261a",       // Deep spruce green
          primaryHover: "#1d4a30",  // Rich forest green
          accent: "#1e6b3a",        // Pine/Emerald green CTA
          accentHover: "#17522d",
          mint: "#8bcaa0",          // Fresh mint green
          mintLight: "#bfddc9",     // Soft sage green
          mintBg: "#eef7f1",        // Subtle green tint container
          muted: "#5c5c5c",
          subtle: "#8a8a8a",
          dark: "#111111",
          danger: "#b42318",
          warning: "#b54708"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Cal Sans"', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 1px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
