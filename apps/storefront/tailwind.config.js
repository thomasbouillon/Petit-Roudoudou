const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      boxShadow: {
        neomorphism: '10px 10px 20px #00000044, -10px -10px 20px #ffffff44',
        'neomorphism-sm': '5px 5px 10px #00000022, -5px -5px 10px #ffffff44',
      },
      colors: {
        primary: {
          100: '#D27A0F',
        },
        secondary: {
          100: '#E1D4D9',
          900: '#594A4E',
        },
        light: {
          100: '#FAEEE7',
          200: '#F4E2D9',
        },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
          },
          '100%': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'sans-serif'],
      serif: ['var(--font-serif)', 'serif'],
    },
  },
  plugins: [require('@headlessui/tailwindcss')],
};
