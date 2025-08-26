/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(0, 0, 0)',
        foreground: 'rgb(255, 255, 255)',
        primary: {
          DEFAULT: 'rgb(147, 51, 234)',
          foreground: 'rgb(255, 255, 255)',
        },
        secondary: {
          DEFAULT: 'rgb(39, 39, 42)',
          foreground: 'rgb(255, 255, 255)',
        },
        accent: {
          DEFAULT: 'rgb(34, 197, 94)',
          foreground: 'rgb(0, 0, 0)',
        },
        destructive: {
          DEFAULT: 'rgb(239, 68, 68)',
          foreground: 'rgb(255, 255, 255)',
        },
        muted: {
          DEFAULT: 'rgb(39, 39, 42)',
          foreground: 'rgb(163, 163, 163)',
        },
        card: {
          DEFAULT: 'rgb(24, 24, 27)',
          foreground: 'rgb(255, 255, 255)',
        },
        border: 'rgb(39, 39, 42)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      boxShadow: {
        'glow': '0 0 20px rgb(147, 51, 234)',
        'glow-green': '0 0 20px rgb(34, 197, 94)',
        'glow-red': '0 0 20px rgb(239, 68, 68)',
      }
    },
  },
  plugins: [],
}