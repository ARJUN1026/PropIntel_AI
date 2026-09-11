import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F5',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1B1C1E',
          soft: '#3F4043',
          muted: '#6D6F73',
          faint: '#9A9CA1',
          inverse: '#F4F4F2',
        },
        paper: '#101113',
        paper2: '#18191C',
        edge: {
          light: '#E7E7E3',
          dark: 'rgba(244,244,242,0.08)',
        },
        brass: {
          50: '#FBF9F4',
          100: '#F3EEDF',
          200: '#E5D9B8',
          300: '#D6C28E',
          400: '#C9AD66',
          500: '#B9984A',
          600: '#A87E35',
          700: '#8A652C',
          800: '#6E5127',
          900: '#5A4323',
        },
        sage: {
          100: '#E2EAE2',
          500: '#4A7A5E',
          700: '#35593F',
        },
        brick: {
          100: '#F6E2DE',
          500: '#B4463C',
          700: '#8C3128',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        body: ['"Sora"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,28,30,0.05), 0 8px 28px -12px rgba(27,28,30,0.14)',
        lift: '0 2px 4px rgba(27,28,30,0.06), 0 18px 44px -14px rgba(27,28,30,0.22)',
        darkcard: '0 1px 0 rgba(244,244,242,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.55)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
