/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ghBg: '#0d1117',
        ghCanvas: '#161b22',
        ghBorder: '#30363d',
        ghText: '#c9d1d9',
        ghMuted: '#8b949e',
        ghPrimary: '#2f81f7',
        ghSuccess: '#3fb950',
      },
    },
  },
  plugins: [],
};
