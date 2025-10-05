/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ed',
          100: '#fce8d6',
          500: '#D07E47',
          600: '#c96d3d',
          700: '#b85e34',
        },
        success: {
          50: '#f9f0f6',
          100: '#f1dfe9',
          500: '#a66794',
          600: '#955b84',
          700: '#845075',
        },
        warning: {
          50: '#fef5ed',
          100: '#fce8d6',
          500: '#e89558',
          600: '#d88446',
          700: '#c77435',
        },
        error: {
          50: '#fef0ee',
          100: '#fcddd9',
          500: '#d88575',
          600: '#c97363',
          700: '#b96252',
        },
        cosmic: {
          purple: '#a66794',
          orange: '#D07E47',
          orangeLight: '#e89558',
          brown: '#6b5d52',
          dark: '#0d0a0f',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'cosmic-glow': 'cosmicGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        cosmicGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(232, 149, 88, 0.2), 0 0 10px rgba(184, 122, 166, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(232, 149, 88, 0.4), 0 0 20px rgba(184, 122, 166, 0.2)' 
          },
        },
      },
    },
  },
  plugins: [],
} 