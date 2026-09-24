import { forwardRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { SITE_URL } from '../lib/config'
import { blessingFor } from '../lib/blessing'

const POSTER_STARS = [
  { left: 8, top: 12, size: 2 },
  { left: 22, top: 26, size: 3 },
  { left: 38, top: 8, size: 2 },
  { left: 58, top: 18, size: 2 },
  { left: 76, top: 9, size: 3 },
  { left: 90, top: 24, size: 2 },
  { left: 14, top: 40, size: 2 },
  { left: 84, top: 44, size: 2 },
]

/**
 * 分享海报（固定 360px 宽，供 html2canvas 截图使用）
 */
const PosterCard = forwardRef(function PosterCard({ player, result, finishedAt, siteUrl = SITE_URL }, ref) {
  const { score, total } = result
  const dateText = finishedAt
    ? new Date(finishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        width: 360,
        padding: '22px 20px 26px',
        borderRadius: 26,
        color: '#fff6d8',
        background: 'linear-gradient(180deg, #050b1f 0%, #0d1738 52%, #1b2a5e 100%)',
        border: '1px solid rgba(255, 217, 119, 0.35)',
        fontFamily: 'KaiTi, STKaiti, "Songti SC", SimSun, serif',
      }}
    >
      {/* 星星 */}
      {POSTER_STARS.map((star, index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            borderRadius: 999,
            background: '#fff6d8',
            opacity: 0.75,
          }}
        />
      ))}

      {/* 圆月 */}
      <div
        style={{
          position: 'absolute',
          right: -26,
          top: -34,
          width: 150,
          height: 150,
          borderRadius: 999,
          background: 'radial-gradient(circle at 36% 34%, #fffdf1 0%, #ffeaa8 58%, #f2ca68 100%)',
          boxShadow: '0 0 44px rgba(255, 233, 168, 0.55)',
        }}
      />

      <div style={{ position: 'relative' }}>
        <p style={{ fontSize: 13, letterSpacing: 6, color: 'rgba(255,233,168,0.85)' }}>花好月圆 · 灯谜贺秋</p>
        <h2 style={{ marginTop: 8, fontSize: 27, fontWeight: 700, letterSpacing: 2, color: '#ffe9a8' }}>
          中秋灯谜 · 答题战报
        </h2>

        {/* 得分 */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              border: '2px solid rgba(255,217,119,0.7)',
              background: 'rgba(5,11,31,0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 22px rgba(247,195,74,0.4)',
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, color: '#ffd977', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,246,216,0.75)' }}>/ {total} 题</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 19, fontWeight: 700, color: '#fff6d8' }}>{player.name}</p>
            <p style={{ marginTop: 5, fontSize: 13, color: 'rgba(255,246,216,0.8)', lineHeight: 1.5 }}>
              {player.className}
            </p>
            <p style={{ marginTop: 3, fontSize: 13, color: 'rgba(255,246,216,0.8)' }}>
              学号：{player.studentId}
            </p>
          </div>
        </div>

        {/* 祝福语 */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 14,
            border: '1px dashed rgba(255,217,119,0.5)',
            background: 'rgba(255,233,168,0.08)',
            fontSize: 13.5,
            lineHeight: 1.7,
          }}
        >
          {blessingFor(score, total)}
        </div>

        {/* 二维码 */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              padding: 7,
              borderRadius: 12,
              background: '#fffdf1',
              lineHeight: 0,
              boxShadow: '0 0 16px rgba(255,217,119,0.35)',
            }}
          >
            <QRCodeCanvas value={siteUrl} size={88} bgColor="#fffdf1" fgColor="#050b1f" level="M" marginSize={2} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#ffe9a8' }}>扫码一起来猜灯谜</p>
            <p style={{ marginTop: 5, fontSize: 11.5, color: 'rgba(255,246,216,0.7)', wordBreak: 'break-all' }}>
              {siteUrl}
            </p>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 11.5, color: 'rgba(255,246,216,0.55)', textAlign: 'center' }}>
          {dateText} · 中秋灯谜答题系统
        </p>
      </div>
    </div>
  )
})

export default PosterCard
