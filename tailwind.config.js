/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
      },
      colors: {
        base: '#030303',
        card: '#0A0A0A',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
        'slow-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        draw: {
          '0%': { strokeDashoffset: '2000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 4s ease-in-out infinite',
        'slow-rotate': 'slow-rotate 20s linear infinite',
        'reveal-up': 'reveal-up 0.6s ease-out forwards',
        'subtle-float': 'subtle-float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        draw: 'draw 2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
