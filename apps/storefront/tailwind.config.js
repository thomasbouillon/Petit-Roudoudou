const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '{src,pages,components,app,contexts}/**/*!(*.stories|*.spec).tsx'),
    ...createGlobPatternsForDependencies(__dirname, '**/*!(*.stories|*.spec).tsx'),
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
          100: '#FFF0E8',
          200: '#F4E2D9',
        },
      },
      animation: {
        'slide-up': 'slide-up 200ms ease-out',
        'slide-step-left': 'slide-step-left  200ms ease-out ',
      },
      keyframes: {
        'slide-step-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
          },
          '100%': {
            transform: 'translateY(0)',
          },
        },
        'slide-half-left': {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-50%)',
          },
        },
      },
    },
    fontFamily: {
      sans: ['var(--font-sans)', 'sans-serif'],
      serif: ['var(--font-serif)', 'serif'],
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
    plugin(function ({ addVariant }) {
      addVariant('progress-unfilled', ['&::-webkit-progress-bar', '&']);
      addVariant('progress-filled', ['&::-webkit-progress-value', '&::-moz-progress-bar']);
    }),
  ],
};
