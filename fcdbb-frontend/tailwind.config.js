/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fc: {
          950: '#050b16',
          900: '#0a1628',
          800: '#0f1f38',
          700: '#13294b',
          600: '#1a3563',
          500: '#1e3a8a',
          400: '#2f5aa8',
          300: '#5b82c4',
          light: '#3b82f6',
          DEFAULT: '#1d4ed8',
          dark: '#0a1628',
          accent: '#38bdf8',
          live: '#f5c451',
        },
        chalk: {
          '050': '#f8fafc',
          '100': '#eef2f7',
          '200': '#cbd5e1',
          muted: '#8ea3c2',
        },
        gold: '#f5c451',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'floodlight': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(30,58,138,0.35), transparent 60%), linear-gradient(180deg, #050b16 0%, #0a1628 40%, #0f1f38 100%)',
        'shine': 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
      },
      boxShadow: {
        'glow-blue': '0 8px 40px -8px rgba(56,189,248,0.35)',
        'glow-blue-lg': '0 20px 60px -12px rgba(30,58,138,0.55)',
        'glow-gold': '0 6px 24px -6px rgba(245,196,81,0.45)',
      },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-out': 'fadeOut 0.25s ease-in forwards',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-live': 'pulseLive 1.8s ease-in-out infinite',
        'ring-pulse': 'ringPulse 1.6s ease-out infinite',
        'shine-sweep': 'shineSweep 2.2s ease-in-out infinite',
        'count-glow': 'countGlow 2s ease-in-out infinite',
        'crest-shine': 'crestShine 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(110%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeOut: {
          '0%': { transform: 'translateX(0)', opacity: 1 },
          '100%': { transform: 'translateX(110%)', opacity: 0 },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseLive: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(248,113,113,0.55)' },
          '50%': { boxShadow: '0 0 0 6px rgba(248,113,113,0)' },
        },
        ringPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(56,189,248,0.45)' },
          '100%': { boxShadow: '0 0 0 22px rgba(56,189,248,0)' },
        },
        shineSweep: {
          '0%': { backgroundPosition: '-150% 0' },
          '100%': { backgroundPosition: '250% 0' },
        },
        countGlow: {
          '0%, 100%': { textShadow: '0 0 12px rgba(245,196,81,0.15)' },
          '50%': { textShadow: '0 0 18px rgba(245,196,81,0.4)' },
        },
        crestShine: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}