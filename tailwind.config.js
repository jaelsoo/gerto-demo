/** @type {import('tailwindcss').Config} — Tailwind CSS v3.4 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens semânticos (mudam entre modo claro e escuro — ver src/index.css)
        bg: token('bg'),
        card: token('card'),
        surface: token('surface'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        primary: token('primary'),
        accent: token('accent'),
        // Paleta oficial do projeto
        sand: '#DDD8C4',
        sage: '#A3C9A8',
        mint: '#84B59F',
        teal: '#69A297',
        petrol: '#50808E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04)',
        sheet: '0 -8px 40px rgb(0 0 0 / 0.18)',
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'pop-in': { from: { opacity: 0, transform: 'scale(.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'toast-in': { from: { opacity: 0, transform: 'translateY(-12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'sheet-up': 'sheet-up .28s cubic-bezier(.2,.8,.2,1)',
        'pop-in': 'pop-in .18s ease-out',
        'fade-in': 'fade-in .2s ease-out',
        'toast-in': 'toast-in .25s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};
