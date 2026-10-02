/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sandstone: {
          50: '#FBF9F5', // Main chat area
          100: '#F7F3EC', // Overall background
          200: '#EFE8DC', // Sidebar
          300: '#E5D8C7', // Subtle borders
          800: '#7D6A58', // Secondary text
          900: '#3A2A20', // Primary text
        },
        warm: {
          muted: '#A49380', // Muted text
        },
        accent: {
          DEFAULT: '#E98B2A', // Orange accent
          hover: '#D97718',
          light: '#F3A44A', // Selected workspace bg
          dark: '#3B2415', // Selected workspace text
        }
      },
      boxShadow: {
        'sand': '0 4px 20px rgba(80, 50, 20, 0.06)',
        'ai-glow': '0 0 15px rgba(233, 139, 42, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        drift: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ai-pulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.9, transform: 'scale(1.02)' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      },
      animation: {
        'drift': 'drift 60s linear infinite',
        'shimmer': 'shimmer 3s infinite linear',
        'ai-pulse': 'ai-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}