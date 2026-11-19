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
          sidebar: "#0f172a",
          sidebarHover: "#1e293b",
          content: "#ffffff",
          canvas: "#f8fafc",
          sand: "#faf8f5",
          border: "#e2e8f0",
          borderStrong: "#cbd5e1",
          primary: "#0f2e2e", // Deep dark teal/slate matching uploaded image button
          primaryHover: "#174343",
          accent: "#2563eb",
          muted: "#64748b"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Newsreader', 'Georgia', 'serif'],
        script: ['Caveat', 'Dancing Script', 'cursive'],
      }
    },
  },
  plugins: [],
}
