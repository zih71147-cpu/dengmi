import { useMemo, useState } from 'react'
import { GITEE, formatDeadline, isClosed, isGiteeConfigured } from '../lib/config'
import { createSelfTestIssue, fetchAllRecords, fetchRecordsFile, probeConnection, saveRecord } from '../lib/gitee'
import { exportRecordsToExcel, formatTime } from '../lib/excel'
import { clearLocalRecords, loadLocalRecords, removeLocalRecord } from '../lib/storage'

export default function AdminPage({ onExit }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [records, setRecords] = useState([])
  const [issuesCount, setIssuesCount] = useState(0)
  const [localRecords, setLocalRecords] = useState(() => loadLocalRecords())
  const [diag, setDiag] = useState([])

  const preview = useMemo(() => (records.length > 0 ? records : localRecords).slice(0, 60), [records, localRecords])
  const sourceLabel = records.length > 0 ? 'Gitee 云端记录' : '本机暂存记录'

  const run = async (task, pendingText) => {
    setBusy(true)
    setStatus(pendingText)
    try {
      await task()
    } catch (error) {
      setStatus(error?.message || '操作失败，请稍后重试')
    } finally {
      setBusy(false)
    }
  }

  const handleFetch = () =>
    run(async () => {
      const { records: list, issuesCount: total, skipped, fileCount } = await fetchAllRecords((loaded) =>
        setStatus(`正在拉取 Gitee Issues…已获取 ${loaded} 条`),
      )
      setRecords(list)
      setIssuesCount(total)
      setStatus(
        `拉取完成：共 ${total} 条 Issue，解析出 ${list.length} 条成绩记录${
          skipped > 0 ? `，跳过 ${skipped} 条非成绩数据` : ''
        }${fileCount > 0 ? `；备用通道 records.json 贡献 ${fileCount} 条` : ''}。可点击「一键导出成绩为 Excel」。`,
      )
    }, '正在从 Gitee 拉取全部 Issue…')

  const handleExportRemote = () => {
    try {
      const count = exportRecordsToExcel(records, '中秋灯谜答题成绩')
      setStatus(`已导出 ${count} 条记录，Excel 含「成绩汇总」与「答题明细」两个工作表。`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleExportLocal = () => {
    try {
      const count = exportRecordsToExcel(localRecords, '中秋灯谜答题成绩_本机暂存')
      setStatus(`已导出本机暂存的 ${count} 条记录。`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const handleRetryLocal = () =>
    run(async () => {
      const list = loadLocalRecords()
      if (list.length === 0) {
        setStatus('本机没有待上传的成绩记录。')
        return
      }
      let success = 0
      const failures = []
      for (const item of list) {
        const { recordId, pendingUpload, ...payload } = item
        void pendingUpload
        try {
          await saveRecord(payload)
          removeLocalRecord(recordId)
          success += 1
        } catch (error) {
          failures.push(error?.message || '未知错误')
        }
      }
      setLocalRecords(loadLocalRecords())
      setStatus(
        `重试完成：成功上传 ${success} 条${failures.length > 0 ? `，失败 ${failures.length} 条（${failures[0]}）` : ''}。`,
      )
    }, '正在重试上传本机暂存记录…')

  const handleClearLocal = () => {
    clearLocalRecords()
    setLocalRecords([])
    setStatus('本机暂存记录已清空。')
  }

  /** 只读自检：令牌 / 仓库 / Issue 读取 */
  const handleProbe = () =>
    run(async () => {
      setDiag([])
      const steps = await probeConnection()
      setDiag(steps)
      const failed = steps.filter((step) => !step.ok)
      setStatus(failed.length === 0 ? '连接自检通过 ✅ 可以正常收集答题数据。' : `自检发现 ${failed.length} 项异常，请看下方明细。`)
    }, '正在自检 Gitee 连接…')

  /** 写入自检：优先验证 Issue 通道，不可用时检测备用通道是否就绪 */
  const handleSelfTest = () =>
    run(async () => {
      try {
        const result = await createSelfTestIssue()
        const detail = result.closed
          ? `创建并关闭成功（Issue #${result.number}）`
          : `Issue #${result.number} 已创建，但关闭失败：${result.closeError}`
        setStatus(`写入自检通过 ✅ Issue 通道可用：${detail}。`)
      } catch (error) {
        let fallbackNote = '备用通道不可用'
        try {
          const file = await fetchRecordsFile()
          fallbackNote = file.sha
            ? `备用通道 records.json 可用（现有 ${file.records.length} 条记录）`
            : '备用通道 records.json 可用（提交第一条成绩时自动创建该文件）'
        } catch (fileError) {
          fallbackNote = `备用通道读取失败：${fileError.message}`
        }
        setStatus(`Issue 写入不可用：${error.message}。成绩将自动降级写入 ${fallbackNote}。`)
      }
    }, '正在验证写入通道…')

  return (
    <div className="flex flex-1 animate-riseup flex-col">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-kai text-2xl font-bold text-gold-200 text-glow sm:text-3xl">后台管理 · 成绩导出</h1>
          <p className="mt-1 text-xs text-gold-100/65 sm:text-sm">数据来源：Gitee Issues API（无后端方案）</p>
        </div>
        <button type="button" className="btn-ghost shrink-0" onClick={onExit}>
          退出
        </button>
      </header>

      <section className="moon-card !p-4 sm:!p-5">
        <div className="relative space-y-2 text-xs sm:text-sm">
          <p className="text-gold-100/80">
            仓库：
            <span className="text-gold-200">{isGiteeConfigured ? `${GITEE.owner}/${GITEE.repo}` : '未配置'}</span>
          </p>
          <p className="text-gold-100/80">
            令牌：<span className="text-gold-200">{GITEE.token ? '已配置' : '未配置（可读取公开仓库 Issue）'}</span>
          </p>
          <p className="text-gold-100/80">
            活动截止：<span className="text-gold-200">{formatDeadline()}</span>（
            {isClosed() ? '已结束' : '进行中'}）
          </p>
          <p className="text-gold-100/80">
            Issue 总数：<span className="text-gold-200">{issuesCount}</span> · 有效成绩：
            <span className="text-gold-200">{records.length}</span> · 本机暂存：
            <span className="text-gold-200">{localRecords.length}</span>
          </p>
        </div>
      </section>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" className="btn-primary" onClick={handleFetch} disabled={busy}>
          一键拉取 Gitee 数据
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleExportRemote}
          disabled={busy || records.length === 0}
        >
          一键导出成绩为 Excel
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleExportLocal}
          disabled={busy || localRecords.length === 0}
        >
          导出本机暂存成绩
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleRetryLocal}
          disabled={busy || localRecords.length === 0}
        >
          重试上传本机成绩
        </button>
        <button type="button" className="btn-ghost" onClick={handleProbe} disabled={busy}>
          连接自检（只读）
        </button>
        <button type="button" className="btn-ghost" onClick={handleSelfTest} disabled={busy}>
          写入自检（建测试 Issue）
        </button>
      </div>

      {status ? (
        <p className="mt-4 break-words rounded-xl border border-gold-300/35 bg-night-900/55 px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm">
          {status}
        </p>
      ) : null}

      {diag.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {diag.map((step) => (
            <li
              key={step.name}
              className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm ${
                step.ok ? 'border-jade-400/45 bg-jade-500/10 text-jade-400' : 'border-lantern-400/50 bg-lantern-600/20'
              }`}
            >
              <span className="mr-1.5" aria-hidden="true">
                {step.ok ? '✅' : '❌'}
              </span>
              <span className="font-bold">{step.name}</span>
              <span className="mt-1 block break-words opacity-90">{step.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-5">
        <h2 className="mb-3 font-kai text-lg font-bold text-gold-200">
          数据预览 <span className="text-xs font-normal text-gold-100/60">（{sourceLabel}，最多显示 60 条）</span>
        </h2>

        {preview.length === 0 ? (
          <p className="rounded-xl border border-gold-300/25 bg-night-900/45 px-3.5 py-3 text-xs text-gold-100/70 sm:text-sm">
            暂无数据，请先点击「一键拉取 Gitee 数据」。
          </p>
        ) : (
          <ul className="space-y-2">
            {preview.map((item, index) => (
              <li
                key={item.issueNumber || item.recordId || index}
                className="rounded-xl border border-gold-300/25 bg-night-900/45 px-3.5 py-2.5 text-xs sm:text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-gold-200">{item.name || '未知'}</span>
                  <span className="text-gold-100/80">{item.className || ''}</span>
                  <span className="text-gold-100/60">学号 {item.studentId || ''}</span>
                  <span className="ml-auto rounded-full border border-gold-300/40 px-2 py-0.5 text-gold-200">
                    {Number(item.correctCount ?? item.score ?? 0)}/{Number(item.totalCount ?? item.total ?? 0)}
                  </span>
                </div>
                <p className="mt-1 text-gold-100/55">
                  {formatTime(item.answeredAt || item.createdAt)} ·{' '}
                  {item.source === 'file'
                    ? '仓库数据文件 records.json'
                    : item.issueNumber
                      ? `Gitee Issue #${item.issueNumber}`
                      : '本机暂存（未上传）'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {localRecords.length > 0 ? (
        <button
          type="button"
          className="btn-ghost mt-5 self-start text-lantern-400"
          onClick={handleClearLocal}
          disabled={busy}
        >
          清空本机暂存记录
        </button>
      ) : null}

    </div>
  )
}
