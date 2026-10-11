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
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', 'cursive'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['Rajdhani', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(245,197,66,0.45), 0 12px 34px -12px rgba(245,197,66,0.40)',
        crimson: '0 0 0 1px rgba(226,59,59,0.55), 0 12px 30px -12px rgba(226,59,59,0.45)',
        lift: '0 18px 40px -18px rgba(0,0,0,0.75)',
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
