/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#000000', 900: '#0A0A0A', 800: '#111111', 700: '#141414', 600: '#1C1C1C', 500: '#262626' },
        gold: { DEFAULT: '#D4AF37', light: '#F5C542', dim: 'rgba(212,175,55,0.25)', soft: 'rgba(212,175,55,0.10)' },
        silver: '#C0C0C0',
        muted: '#A1A1A1',
        danger: '#E5484D',
        success: '#3FB950',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.35)',
        gold: '0 0 0 1px rgba(212,175,55,0.35), 0 8px 24px rgba(212,175,55,0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { 'fade-in': 'fade-in 180ms ease-out both', shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
}
