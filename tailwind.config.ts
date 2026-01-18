import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS Configuration for Family Glitch
 *
 * Design system focused on:
 * - Mobile-first responsive design
 * - Full viewport layouts (no scrolling)
 * - High-contrast colors for restaurant lighting
 * - Touch-friendly sizing (min 44x44px tap targets)
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - vibrant but not overwhelming
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6', // Main blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Secondary colors for variety in UI
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          500: '#a855f7', // Purple
          600: '#9333ea',
        },
        // Success/correct answers
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Warning/time running out
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error/incorrect
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Mobile-optimized font sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        // Touch-friendly minimum tap target
        'touch': '44px',
      },
      height: {
        // Dynamic viewport height (accounts for mobile browser chrome)
        'screen-dynamic': '100dvh',
      },
      minHeight: {
        'screen-dynamic': '100dvh',
      },
      maxHeight: {
        'screen-dynamic': '100dvh',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
