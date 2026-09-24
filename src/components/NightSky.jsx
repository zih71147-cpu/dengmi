import { useMemo } from 'react'

/** 用固定种子生成星星，避免每次渲染位置抖动 */
const STARS = (() => {
  const stars = []
  let seed = 20250915
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < 44; i += 1) {
    stars.push({
      left: Number((next() * 98).toFixed(2)),
      top: Number((next() * 62).toFixed(2)),
      size: Number((next() * 1.8 + 0.9).toFixed(2)),
      delay: Number((next() * 3.5).toFixed(2)),
    })
  }
  return stars
})()

/** 祥云（纯 SVG 装饰，currentColor 控制颜色） */
function AuspiciousCloud({ className = '' }) {
  return (
    <svg viewBox="0 0 240 96" className={className} aria-hidden="true" fill="currentColor">
      <circle cx="62" cy="58" r="24" />
      <circle cx="100" cy="42" r="30" />
      <circle cx="142" cy="52" r="25" />
      <circle cx="176" cy="64" r="18" />
      <rect x="55" y="56" width="122" height="26" rx="13" />
      <path d="M96 24c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Zm0 6c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Z" opacity="0.55" />
      <path d="M142 32c6 0 11 5 11 11s-5 11-11 11-11-5-11-11 5-11 11-11Zm0 5c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6Z" opacity="0.45" />
    </svg>
  )
}

/** 宫灯 */
function Lantern({ className = '' }) {
  return (
    <div className={`absolute origin-top animate-sway ${className}`} aria-hidden="true">
      <div className="mx-auto h-6 w-px bg-gold-300/60 sm:h-10" />
      <div className="mx-auto h-2.5 w-8 rounded-sm bg-gradient-to-b from-gold-200 to-gold-500 sm:h-3.5 sm:w-11" />
      <div className="relative mx-auto -mt-0.5 h-16 w-14 rounded-[48%] bg-gradient-to-b from-lantern-400 via-lantern-500 to-lantern-600 shadow-[0_0_26px_rgba(240,75,47,0.55)] sm:h-24 sm:w-20">
        <span className="absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-gold-200/45" />
        <span className="absolute inset-y-2 left-2.5 w-px bg-gold-200/30" />
        <span className="absolute inset-y-2 right-2.5 w-px bg-gold-200/30" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-kai text-sm font-bold text-gold-100 sm:text-xl">
          谜
        </span>
      </div>
      <div className="mx-auto h-2 w-8 rounded-sm bg-gradient-to-b from-gold-400 to-gold-600 sm:w-12" />
      <div className="mx-auto h-6 w-1 rounded-full bg-gold-300/70 sm:h-9" />
    </div>
  )
}

/** 圆月 */
function FullMoon() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[-9vmin] -translate-x-1/2">
      <div className="animate-floaty">
        <div
          className="relative rounded-full bg-[radial-gradient(circle_at_35%_32%,#fffdf1_0%,#ffeaa8_55%,#f4cf72_100%)] shadow-moon"
          style={{ width: 'clamp(112px, 32vmin, 250px)', height: 'clamp(112px, 32vmin, 250px)' }}
        >
          <span className="absolute left-[24%] top-[30%] h-[9%] w-[9%] rounded-full bg-gold-500/20" />
          <span className="absolute left-[52%] top-[22%] h-[6%] w-[6%] rounded-full bg-gold-500/15" />
          <span className="absolute left-[38%] top-[58%] h-[12%] w-[12%] rounded-full bg-gold-500/15" />
          <span className="absolute right-[16%] top-[46%] h-[7%] w-[7%] rounded-full bg-gold-500/20" />
        </div>
      </div>
    </div>
  )
}

/** 夜空背景：星星 + 圆月 + 祥云 + 宫灯，全局 overflow-hidden 保证不产生横向滚动 */
export default function NightSky({ children }) {
  const stars = useMemo(() => STARS, [])

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-gradient-to-b from-night-900 via-night-800 to-night-700">
      {/* 星星 */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star, index) => (
          <span
            key={index}
            className="absolute animate-twinkle rounded-full bg-gold-100"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <FullMoon />

      {/* 祥云 */}
      <AuspiciousCloud className="pointer-events-none absolute left-[-14%] top-[16%] w-[52vw] max-w-[280px] animate-drift text-gold-200/20" />
      <AuspiciousCloud className="pointer-events-none absolute right-[-16%] top-[34%] w-[46vw] max-w-[240px] animate-drift text-jade-400/15 [animation-delay:3s]" />
      <AuspiciousCloud className="pointer-events-none absolute bottom-[8%] left-[-10%] w-[60vw] max-w-[320px] animate-drift text-gold-300/10 [animation-delay:6s]" />

      {/* 宫灯 */}
      <Lantern className="left-1 top-0 scale-90 sm:left-6 sm:scale-100" />
      <Lantern className="right-1 top-0 scale-90 sm:right-6 sm:scale-100" />

      {/* 页面内容 */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        {children}
      </div>
    </div>
  )
}
