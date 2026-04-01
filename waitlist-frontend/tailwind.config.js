/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0a0e1a',
        deep: '#060910',
        gold: '#c9a84c',
        'gold-light': '#e4c97a',
        'gold-dim': 'rgba(201,168,76,0.18)',
        ivory: '#f5f0e8',
        'ivory-dim': 'rgba(245,240,232,0.65)',
        cream: '#ede8dd',
        muted: 'rgba(245,240,232,0.4)',
        'unswap-border': 'rgba(201,168,76,0.25)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
};
