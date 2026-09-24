import { useRef, useState } from 'react'
import { RIDDLES, CULTURE_TYPE, DRAW_COUNT } from '../lib/quiz'

const FIELDS = [
  { key: 'name', label: '姓名', placeholder: '请输入你的姓名', maxLength: 20 },
  { key: 'className', label: '专业班级', placeholder: '如：计算机科学与技术 2301 班', maxLength: 30 },
  { key: 'studentId', label: '学号', placeholder: '请输入你的学号', maxLength: 20, inputMode: 'numeric' },
]

const EMPTY_FORM = { name: '', className: '', studentId: '' }

export default function InfoPage({ onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const inputRefs = useRef({})

  const cultureCount = RIDDLES.filter((item) => item.type === CULTURE_TYPE).length

  const handleChange = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const validate = () => {
    const nextErrors = {}
    FIELDS.forEach(({ key, label }) => {
      if (!form[key].trim()) nextErrors[key] = `请填写${label}`
    })
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    const firstErrorKey = FIELDS.find(({ key }) => nextErrors[key])?.key
    if (firstErrorKey) {
      inputRefs.current[firstErrorKey]?.focus()
      return
    }
    onSubmit({
      name: form.name.trim(),
      className: form.className.trim(),
      studentId: form.studentId.trim(),
    })
  }

  return (
    <div className="flex flex-1 animate-riseup flex-col items-center justify-center">
      <header className="mb-6 w-full text-center sm:mb-8">
        <p className="font-kai text-sm tracking-[0.4em] text-gold-200/80 sm:text-base">花好月圆 · 灯谜贺秋</p>
        <h1 className="mt-3 font-kai text-4xl font-bold tracking-wider text-gold-200 text-glow sm:text-5xl">
          中秋灯谜
        </h1>
        <p className="mt-3 text-sm text-gold-100/70 sm:text-base">
          共 {RIDDLES.length} 道灯谜 · 随机抽取 {DRAW_COUNT} 题 · 至少含 1 道中秋习俗题
        </p>
      </header>

      <section className="moon-card">
        <div className="relative">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gold-300/50" />
            <h2 className="font-kai text-xl font-bold text-gold-200 sm:text-2xl">填写信息，开始答题</h2>
            <span className="h-px w-8 bg-gold-300/50" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 三行输入框，统一放在一个方框内 */}
            <div className="space-y-4 rounded-2xl border border-gold-300/25 bg-night-900/45 p-4 sm:p-5">
              {FIELDS.map(({ key, label, placeholder, maxLength, inputMode }) => (
                <div key={key}>
                  <label className="field-label" htmlFor={`field-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`field-${key}`}
                    ref={(node) => {
                      inputRefs.current[key] = node
                    }}
                    className={`input-base ${errors[key] ? 'input-error' : ''}`}
                    type="text"
                    inputMode={inputMode || 'text'}
                    autoComplete="off"
                    maxLength={maxLength}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={handleChange(key)}
                  />
                  {errors[key] ? (
                    <p className="mt-1 text-xs text-lantern-400 sm:text-sm">{errors[key]}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary">
              <span>开始答题</span>
              <span aria-hidden="true">🏮</span>
            </button>

            <p className="text-center text-xs leading-relaxed text-gold-100/55">
              信息仅用于成绩统计，提交后自动记录答题结果。
              <br />
              题库含 {cultureCount} 道中秋习俗文化题，祝你月圆人团圆。
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
