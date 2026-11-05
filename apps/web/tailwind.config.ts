import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#29251f',
        paper: '#fbf8f2',
        ember: '#a94726',
      },
      boxShadow: {
        card: '0 12px 32px rgb(41 37 31 / 6%)',
      },
    },
  },
  plugins: [],
};

export default config;
