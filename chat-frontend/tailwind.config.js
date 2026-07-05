/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F1117',
        surface: '#171A23',
        surface2: '#1E2230',
        border: '#2A2F40',
        accent: {
          DEFAULT: '#6C5CE7',
          dim: '#5546C8',
          glow: '#8B7FFF',
        },
        signal: '#2ED573',
        coral: '#FF6B6B',
        amber: '#FFC857',
        ink: '#E8E9F3',
        muted: '#8B90A8',
        faint: '#5A5F75',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        'msg-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'msg-in': 'msg-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0,0,0.2,1) infinite',
        'typing-bounce': 'typing-bounce 1.2s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
