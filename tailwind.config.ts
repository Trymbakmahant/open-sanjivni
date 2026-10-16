import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          crimson: '#E11D48',
          red: '#EF4444',
          coral: '#FF5722',
          dark: '#0F172A',
          slate: '#1E293B',
          bg: '#FAFAFA',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        elevated: '0 12px 32px -4px rgba(0, 0, 0, 0.08)',
        circle: '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
        'circle-active': '0 10px 25px rgba(225, 29, 72, 0.35)',
        phone: '0 25px 60px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '28px',
        phone: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
