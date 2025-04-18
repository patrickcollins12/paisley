/** @type {import('tailwindcss').Config} */
export default {
  // This tells Tailwind to look at your index.css for configuration
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Ensure Tailwind uses the config from your CSS file
  // No theme, plugins, etc. needed here as they are in index.css
} 