/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#000000',
          100: '#0a0a0a',
          200: '#171717',
          300: '#262626',
          400: '#404040',
          500: '#525252',
          600: '#737373',
          700: '#a3a3a3',
          800: '#d4d4d4',
          900: '#f5f5f5',
          950: '#ffffff',
        },
        secondary: {
          50: '#0c0a1f',
          100: '#1e1b3a',
          200: '#2d2748',
          300: '#3f3659',
          400: '#524569',
          500: '#6b5b95',
          600: '#8b7ab8',
          700: '#a99bd1',
          800: '#c7bce8',
          900: '#e5ddf0',
        },
        accent: {
          400: '#06ffa5',
          500: '#00ff88',
          600: '#00e574',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient-shift 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px -10px rgb(37 99 235)' },
          'to': { boxShadow: '0 0 30px -5px rgb(0 255 136)' },
        },
        'gradient-shift': {
          '0%, 100%': { transform: 'translateX(0%) translateY(0%)' },
          '50%': { transform: 'translateX(-20%) translateY(-10%)' },
        }
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
} 