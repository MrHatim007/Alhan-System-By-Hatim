/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          main: '#050814',
          surface: 'rgba(10, 15, 36, 0.45)',
          surfaceOpaque: '#090c1e',
          glass: 'rgba(8, 12, 32, 0.5)',
        },
        neon: {
          cyan: '#0ea5e9',
          pink: '#ec4899',
          green: '#10b981',
          amber: '#f59e0b',
          purple: '#b5179e',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0aec0',
          muted: '#5e6b8c',
        }
      },
      fontFamily: {
        en: ['Outfit', 'sans-serif'],
        ar: ['Cairo', 'sans-serif'],
        num: ['Monaco', 'monospace'],
      },
      backdropBlur: {
        glass: '20px',
      },
      spacing: {
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '56px': '56px',
        '64px': '64px',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(14, 165, 233, 0.35)',
        'neon-pink': '0 0 15px rgba(236, 72, 153, 0.35)',
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.35)',
        'neon-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass-panel': {
          background: 'rgba(8, 12, 32, 0.5)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          'border-radius': '16px',
          'box-shadow': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        },
        '.glass-panel-hover': {
          'border-color': 'rgba(255, 255, 255, 0.15)',
          transform: 'translateY(-2px)',
          'box-shadow': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
        }
      })
    }
  ],
}
