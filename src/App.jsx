import { useEffect, useRef, useState } from 'react'
import NightSky from './components/NightSky'
import InfoPage from './pages/InfoPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import AdminPage from './pages/AdminPage'
import { gradeAnswers, pickQuestions } from './lib/quiz'
import { ADMIN_PASSWORD, SITE_URL } from './lib/config'
import { saveRecord } from './lib/gitee'
import { saveLocalRecord } from './lib/storage'

export default function App() {
  const [view, setView] = useState('info')
  const [player, setPlayer] = useState(null)
  const [questions, setQuestions] = useState([])
  const [result, setResult] = useState(null)
  const [finishedAt, setFinishedAt] = useState('')
  const [uploadState, setUploadState] = useState('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [gateOpen, setGateOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [gateError, setGateError] = useState('')

  const passwordRef = useRef(null)

  // 每次切换页面回到顶部，避免手机端停留在上一页的滚动位置
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view])

  useEffect(() => {
    if (gateOpen) passwordRef.current?.focus()
  }, [gateOpen])

  /** 静默上传答题记录：Issue 优先 → 仓库数据文件 → 浏览器本地兜底 */
  const uploadRecord = async (record) => {
    setUploadState('uploading')
    setUploadMessage('')
    try {
      const { backend, issueError } = await saveRecord(record)
      setUploadState(backend === 'file' ? 'file' : 'success')
      setUploadMessage(backend === 'file' && issueError ? `Issue 通道不可用，已改用仓库数据文件（${issueError}）` : '')
    } catch (error) {
      saveLocalRecord(record)
      setUploadState('fallback')
      setUploadMessage(error?.message || '上传失败')
    }
  }

  const handleStart = (info) => {
    setPlayer(info)
    setQuestions(pickQuestions())
    setResult(null)
    setFinishedAt('')
    setUploadState('idle')
    setUploadMessage('')
    setView('quiz')
  }

  const handleFinish = (answers) => {
    const graded = gradeAnswers(questions, answers)
    const time = new Date().toISOString()

    setResult(graded)
    setFinishedAt(time)
    setView('result')

    uploadRecord({
      name: player.name,
      className: player.className,
      studentId: player.studentId,
      correctCount: graded.score,
      totalCount: graded.total,
      accuracy: graded.accuracy,
      answeredAt: time,
      siteUrl: SITE_URL,
      details: graded.details.map((item) => ({
        id: item.id,
        type: item.type,
        question: item.question,
        userAnswer: item.userAnswer,
        expected: item.expected,
        correct: item.correct,
      })),
    })
  }

  const handleRestart = () => {
    setView('info')
    setPlayer(null)
    setQuestions([])
    setResult(null)
    setFinishedAt('')
    setUploadState('idle')
    setUploadMessage('')
  }

  const closeGate = () => {
    setGateOpen(false)
    setPassword('')
    setGateError('')
  }

  const handleGateSubmit = (event) => {
    event.preventDefault()
    if (password.trim() === ADMIN_PASSWORD) {
      closeGate()
      setView('admin')
      return
    }
    setGateError('密码不正确，请重新输入')
  }

  return (
    <NightSky>
      {view === 'info' ? <InfoPage onSubmit={handleStart} /> : null}

      {view === 'quiz' ? (
        <QuizPage
          player={player}
          questions={questions}
          onSubmit={handleFinish}
          onBack={() => setView('info')}
        />
      ) : null}

      {view === 'result' ? (
        <ResultPage
          player={player}
          result={result}
          finishedAt={finishedAt}
          uploadState={uploadState}
          uploadMessage={uploadMessage}
          onRestart={handleRestart}
        />
      ) : null}

      {view === 'admin' ? <AdminPage onExit={() => setView('info')} /> : null}

      {/* 隐蔽的后台管理入口（左下角半透明小图标） */}
      {view !== 'admin' ? (
        <button
          type="button"
          aria-label="后台管理入口"
          title="后台管理"
          onClick={() => setGateOpen(true)}
          className="fixed bottom-3 left-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border
            border-gold-300/10 bg-night-900/40 text-xs opacity-40 transition hover:border-gold-300/40 hover:opacity-100"
        >
          <span aria-hidden="true">🌙</span>
        </button>
      ) : null}

      {/* 后台密码弹窗 */}
      {gateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/85 px-4 backdrop-blur-sm">
          <form className="moon-card max-w-xs" onSubmit={handleGateSubmit}>
            <div className="relative">
              <h2 className="font-kai text-lg font-bold text-gold-200">后台管理验证</h2>
              <p className="mt-1 text-xs text-gold-100/60">请输入管理密码后进入成绩导出界面</p>
              <input
                ref={passwordRef}
                className="input-base mt-3"
                type="password"
                autoComplete="off"
                placeholder="管理密码"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setGateError('')
                }}
              />
              {gateError ? <p className="mt-1 text-xs text-lantern-400">{gateError}</p> : null}
              <div className="mt-4 flex gap-2">
                <button type="submit" className="btn-primary !py-2 !text-base sm:flex-1">
                  确定
                </button>
                <button type="button" className="btn-ghost sm:flex-1" onClick={closeGate}>
                  取消
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </NightSky>
  )
}

