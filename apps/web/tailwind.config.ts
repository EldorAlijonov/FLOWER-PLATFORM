import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          900: '#0f172a',
          950: '#020617',
        },
        petal: {
          50: '#fff1f2',
          100: '#ffe4e6',
          600: '#e11d48',
          700: '#be123c',
        },
        sun: {
          50: '#fffbeb',
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
