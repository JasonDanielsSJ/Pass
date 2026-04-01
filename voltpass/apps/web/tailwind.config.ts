import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1e3a5f', light: '#2a5298', dark: '#0f2040' },
        amber: { DEFAULT: '#f59e0b', light: '#fcd34d', dark: '#d97706' },
      },
    },
  },
  plugins: [],
};

export default config;
