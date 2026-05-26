/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Status colors
        status: {
          backlog: '#6b7280',
          todo: '#e5e7eb',
          in_progress: '#f59e0b',
          in_review: '#3b82f6',
          done: '#10b981',
          cancelled: '#ef4444',
        },
        // Priority colors
        priority: {
          urgent: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
          none: '#6b7280',
        },
        // Surface colors
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1a1b23',
        },
        sidebar: {
          DEFAULT: '#f9fafb',
          dark: '#111218',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

