/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bloomberg: {
          bg: {
            primary: '#0C0E0F',
            secondary: '#161A1E',
            tertiary: '#1E2428',
            hover: '#252B30',
          },
          text: {
            primary: '#E5E7EB',
            secondary: '#9CA3AF',
            muted: '#6B7280',
          },
          border: {
            DEFAULT: '#2A3038',
            focus: '#3B82F6',
          },
          accent: {
            blue: '#0061FF',
            orange: '#FF6B00',
          },
          financial: {
            positive: '#22C55E',
            negative: '#EF4444',
            neutral: '#6B7280',
            call: '#3B82F6',
            put: '#EC4899',
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xxs: '0.625rem',
      }
    },
  },
  plugins: [],
}

