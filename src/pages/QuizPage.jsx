import { useMemo, useRef, useState } from 'react'

export default function QuizPage({ player, questions, onSubmit, onBack }) {
  const [answers, setAnswers] = useState(() => questions.map(() => ''))
  const [warned, setWarned] = useState(false)
  const inputRefs = useRef([])

  const blankCount = useMemo(() => answers.filter((item) => !item.trim()).length, [answers])

  const handleChange = (index) => (event) => {
    const value = event.target.value
    setAnswers((prev) => prev.map((item, i) => (i === index ? value : item)))
    setWarned(false)
  }

  const handleSubmit = () => {
    // 有未作答题目时，第一次点击仅提醒，避免误提交
    if (blankCount > 0 && !warned) {
      setWarned(true)
      return
    }
    onSubmit(answers)
  }

  return (
    <div className="flex flex-1 animate-riseup flex-col">
      <header className="mb-5 text-center">
        <p className="font-kai text-sm tracking-[0.35em] text-gold-200/80">月满中秋 · 灯谜竞猜</p>
        <h1 className="mt-2 font-kai text-2xl font-bold text-gold-200 text-glow sm:text-3xl">
          {player.name} 的答题卷
        </h1>
        <p className="mt-2 text-xs text-gold-100/70 sm:text-sm">
          {player.className} · 共 {questions.length} 题 · 无需全部答对，尽力而为即可
        </p>
      </header>

      <div className="space-y-4">
        {questions.map((riddle, index) => (
          <section key={riddle.id} className="moon-card !p-4 sm:!p-5">
            <div className="relative">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-300/50 bg-night-900/70 font-kai text-sm font-bold text-gold-200">
                  {index + 1}
                </span>
                <span className="type-tag">{riddle.type}</span>
              </div>

              <p className="font-kai text-base leading-relaxed text-gold-100 sm:text-lg">{riddle.question}</p>

              <input
                ref={(node) => {
                  inputRefs.current[index] = node
                }}
                className="input-base mt-3.5"
                type="text"
                autoComplete="off"
                maxLength={60}
                placeholder="在此写下你的谜底…"
                value={answers[index]}
                onChange={handleChange(index)}
              />
            </div>
          </section>
        ))}
      </div>

      {warned && blankCount > 0 ? (
        <p className="mt-4 rounded-xl border border-lantern-400/50 bg-lantern-600/20 px-3 py-2 text-center text-sm text-gold-100">
          还有 {blankCount} 题未作答，未作答将计为答错；再次点击「回答完毕」即可提交。
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={onBack}>
          重新填写
        </button>
        <span className="text-xs text-gold-100/55 sm:text-sm">
          已作答 {questions.length - blankCount}/{questions.length}
        </span>
      </div>

      {/* 右下角悬浮提交按钮 */}
      <button
        type="button"
        onClick={handleSubmit}
        className="fixed bottom-5 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-gold-200/70
          bg-gradient-to-b from-gold-300 to-gold-500 px-5 py-3 font-kai text-base font-bold text-night-900
          shadow-glow transition active:scale-95 sm:bottom-8 sm:right-8 sm:text-lg"
      >
        <span aria-hidden="true">🌕</span>
        <span>回答完毕</span>
      </button>
    </div>
  )
}
