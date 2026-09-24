/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 中秋夜色主题色板
        night: {
          900: '#050b1f',
          800: '#0a1330',
          700: '#101c44',
          600: '#1b2a5e',
          500: '#283c7a',
        },
        gold: {
          100: '#fff6d8',
          200: '#ffe9a8',
          300: '#ffd977',
          400: '#f7c34a',
          500: '#e0a520',
          600: '#b8801a',
        },
        jade: {
          400: '#5fbfa0',
          500: '#3f9e81',
        },
        lantern: {
          400: '#ff7a59',
          500: '#f04b2f',
          600: '#c62f19',
        },
      },
      fontFamily: {
        // 优先使用系统自带的中文书法/宋体类字体，避免外网字体加载失败
        kai: ['KaiTi', 'STKaiti', 'Kaiti SC', '楷体', 'STSong', 'Songti SC', 'SimSun', 'serif'],
        song: ['Songti SC', 'STSong', 'SimSun', '宋体', 'serif'],
      },
      boxShadow: {
        moon: '0 0 40px rgba(255, 236, 179, 0.55), 0 0 100px rgba(255, 213, 122, 0.35)',
        glow: '0 0 18px rgba(247, 195, 74, 0.45)',
        card: '0 18px 45px rgba(3, 8, 25, 0.55)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        drift: {
          '0%': { transform: 'translateX(-4%)' },
          '50%': { transform: 'translateX(6%)' },
          '100%': { transform: 'translateX(-4%)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.9' },
        },
        riseup: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        sway: 'sway 5s ease-in-out infinite',
        drift: 'drift 26s ease-in-out infinite',
        twinkle: 'twinkle 3.5s ease-in-out infinite',
        riseup: 'riseup 0.45s ease-out both',
      },
    },
  },
  plugins: [],
}
