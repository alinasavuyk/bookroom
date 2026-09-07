/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#3C3489',
          purpleLight: '#7F77DD',
          purpleSoft: '#AFA9EC',
        },
      },
      screens: {
        // адаптивність: телефон -> планшет -> десктоп
        sm: '480px',
        md: '768px',  // планшет
        lg: '1024px', // ноутбук
        xl: '1280px', // великий екран
      },
    },
  },
  plugins: [],
};
