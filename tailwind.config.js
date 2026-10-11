/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        text: 'rgb(var(--text-rgb) / <alpha-value>)',
        'text-dim': 'rgb(var(--text-dim-rgb) / <alpha-value>)',
        gold: 'rgb(var(--gold-rgb) / <alpha-value>)',
        'gold-2': 'rgb(var(--gold-2-rgb) / <alpha-value>)',
        crimson: 'rgb(var(--crimson-rgb) / <alpha-value>)',
        jade: 'rgb(var(--jade-rgb) / <alpha-value>)',
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      fontFamily: {
        display: ['"Noto Sans SC"', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['Rajdhani', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(245,197,66,0.45), 0 14px 40px -16px rgba(245,197,66,0.35)',
        crimson: '0 0 0 1px rgba(229,72,77,0.5), 0 12px 30px -14px rgba(229,72,77,0.40)',
        lift: '0 20px 48px -22px rgba(0,0,0,0.80)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        sheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        sheen: 'sheen 8s linear infinite',
      },
    },
  },
  plugins: [],
};
