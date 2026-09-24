import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import PosterCard from '../components/PosterCard'
import { blessingFor } from '../lib/blessing'
import { formatTime } from '../lib/excel'

export default function ResultPage({ player, result, finishedAt, onRestart }) {
  const posterRef = useRef(null)
  const [posterUrl, setPosterUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [posterError, setPosterError] = useState('')

  const handleGeneratePoster = async () => {
    if (!posterRef.current || generating) return
    setGenerating(true)
    setPosterError('')
    try {
      if (document.fonts?.ready) await document.fonts.ready
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050b1f',
        logging: false,
      })
      setPosterUrl(canvas.toDataURL('image/png'))
    } catch {
      setPosterError('海报生成失败，请重试，或直接使用手机截屏保存本页。')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-1 animate-riseup flex-col">
      <section className="moon-card text-center">
        <div className="relative">
          <p className="font-kai text-sm tracking-[0.35em] text-gold-200/80">答题结果 · 月圆揭榜</p>

          <div className="mx-auto mt-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-gold-300/70 bg-night-900/60 shadow-glow sm:h-36 sm:w-36">
            <span className="font-kai text-5xl font-bold text-gold-200 text-glow sm:text-6xl">{result.score}</span>
            <span className="mt-1 text-xs text-gold-100/70 sm:text-sm">共 {result.total} 题</span>
          </div>

          <h1 className="mt-4 font-kai text-2xl font-bold text-gold-200 sm:text-3xl">
            {player.name} · 答对 {result.score} 题
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gold-100/75 sm:text-base">
            {blessingFor(result.score, result.total)}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="rounded-full border border-gold-300/35 bg-night-900/50 px-3 py-1">
              {player.className}
            </span>
            <span className="rounded-full border border-gold-300/35 bg-night-900/50 px-3 py-1">
              学号 {player.studentId}
            </span>
            <span className="rounded-full border border-gold-300/35 bg-night-900/50 px-3 py-1">
              正确率 {result.accuracy}%
            </span>
          </div>

          <p className="mt-3 text-xs text-gold-100/50">答题时间：{formatTime(finishedAt)}</p>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h2 className="font-kai text-lg font-bold text-gold-200 sm:text-xl">逐题回顾</h2>
        {result.details.map((detail, index) => (
          <article
            key={`${detail.id}-${index}`}
            className={`moon-card !p-4 ${detail.correct ? 'border-jade-400/40' : 'border-lantern-400/40'}`}
          >
            <div className="relative flex items-start gap-3">
              <span className="mt-0.5 text-lg" aria-hidden="true">
                {detail.correct ? '✅' : '❌'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-kai text-sm leading-relaxed text-gold-100 sm:text-base">
                  {index + 1}. {detail.question}
                </p>
                <p className="mt-2 text-xs text-gold-100/75 sm:text-sm">
                  你的作答：<span className="text-gold-200">{detail.userAnswer || '（未作答）'}</span>
                </p>
                <p className="mt-1 text-xs text-gold-100/75 sm:text-sm">
                  参考答案：<span className="text-gold-300">{detail.expected || '（见解析）'}</span>
                </p>
                {detail.explain ? (
                  <p className="mt-1 text-xs text-gold-100/55 sm:text-sm">解析：{detail.explain}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn-primary sm:flex-1" onClick={handleGeneratePoster} disabled={generating}>
          <span>{generating ? '正在生成海报…' : '生成分享海报'}</span>
          <span aria-hidden="true">🖼️</span>
        </button>
        <button type="button" className="btn-ghost sm:flex-1" onClick={onRestart}>
          再来一轮
        </button>
      </div>

      {posterError ? (
        <p className="mt-3 rounded-xl border border-lantern-400/50 bg-lantern-600/20 px-3 py-2 text-center text-sm">
          {posterError}
        </p>
      ) : null}

      {/* 海报弹窗：移动端可长按保存 */}
      {posterUrl ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-night-900/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setPosterUrl('')}
          role="presentation"
        >
          <div className="w-full max-w-xs text-center" onClick={(event) => event.stopPropagation()} role="presentation">
            <img
              src={posterUrl}
              alt="中秋答题分享海报"
              className="mx-auto w-full rounded-2xl border border-gold-300/40 shadow-card"
            />
            <p className="mt-3 text-xs text-gold-100/80 sm:text-sm">手机端长按图片即可保存到相册</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <a
                className="btn-primary sm:flex-1"
                href={posterUrl}
                download={`中秋灯谜战报_${player.name}.png`}
                onClick={(event) => event.stopPropagation()}
              >
                下载海报
              </a>
              <button type="button" className="btn-ghost sm:flex-1" onClick={() => setPosterUrl('')}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 离屏海报画布（供 html2canvas 截图，不影响页面布局） */}
      <div className="pointer-events-none fixed left-[-10000px] top-0" aria-hidden="true">
        <PosterCard ref={posterRef} player={player} result={result} finishedAt={finishedAt} />
      </div>
    </div>
  )
}
