/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['Fira Code', 'ui-monospace', 'SFMono-Regular'],
      },
      extend: {
        colors: {
          // neutrals
          bg:   '#0d1117',
          panel:'#161b22',
          line: '#1f2937',
          // brand
          cyan: {
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
          },
        },
        boxShadow: {
          card: '0 2px 5px 0 rgb(0 0 0 / .15)',
        },
        transitionProperty: {
          width: 'width', // for the slider thumb trick
        },
      },
    },
    plugins: [],
  };
  