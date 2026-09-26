import * as XLSX from 'xlsx'

/** 把 ISO 时间格式化为本地可读格式 */
export function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`
}

function timestampSuffix() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(
    now.getMinutes(),
  )}`
}

/** 同一学号只保留一份：优先保留最高分；分数相同则保留最早提交的那次 */
export function dedupeByStudent(records) {
  const best = new Map()
  records.forEach((item) => {
    const studentId = String(item.studentId || '').trim()
    const key = studentId || `无学号::${item.name || ''}|${item.className || ''}`
    const current = best.get(key)
    if (!current) {
      best.set(key, item)
      return
    }
    const scoreNew = Number(item.correctCount ?? item.score ?? 0)
    const scoreOld = Number(current.correctCount ?? current.score ?? 0)
    if (scoreNew > scoreOld) {
      best.set(key, item)
      return
    }
    if (scoreNew === scoreOld) {
      const timeNew = String(item.answeredAt || '')
      const timeOld = String(current.answeredAt || '')
      if (timeNew && (!timeOld || timeNew < timeOld)) best.set(key, item)
    }
  })
  return [...best.values()]
}

/** 统计汇总（仅汇总人数/分数段/班级/题目正确率，不含任何个人排名） */
function toStatsRows(records) {
  const rows = []
  const total = records.length
  const scoreOf = (item) => Number(item.correctCount ?? item.score ?? 0)
  const totalOf = (item) => Number(item.totalCount ?? item.total ?? 0)

  rows.push({ 统计项: '参与人数（同学号已去重）', 数值: total, 说明: '同一学号只保留最高分的一次' })
  if (total > 0) {
    const sum = records.reduce((acc, item) => acc + scoreOf(item), 0)
    rows.push({ 统计项: '平均答对题数', 数值: Math.round((sum / total) * 100) / 100, 说明: '满分 3 题' })
    rows.push({
      统计项: '满分人数',
      数值: records.filter((item) => totalOf(item) > 0 && scoreOf(item) === totalOf(item)).length,
      说明: '',
    })
    rows.push({ 统计项: '0 分人数', 数值: records.filter((item) => scoreOf(item) === 0).length, 说明: '' })

    const buckets = new Map()
    records.forEach((item) => buckets.set(scoreOf(item), (buckets.get(scoreOf(item)) || 0) + 1))
    ;[...buckets.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([score, count]) => {
        rows.push({
          统计项: `得 ${score} 分人数`,
          数值: count,
          说明: `${Math.round((count / total) * 100)}%`,
        })
      })
  }

  const classMap = new Map()
  records.forEach((item) => {
    const key = String(item.className || '未填写').trim()
    classMap.set(key, (classMap.get(key) || 0) + 1)
  })
  ;[...classMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => rows.push({ 统计项: `班级：${name}`, 数值: count, 说明: '参与人数' }))

  const questionMap = new Map()
  records.forEach((item) => {
    ;(item.details || []).forEach((detail) => {
      const cur = questionMap.get(detail.id) || {
        draws: 0,
        ok: 0,
        type: detail.type,
        question: detail.question,
        expected: detail.expected,
      }
      cur.draws += 1
      if (detail.correct) cur.ok += 1
      questionMap.set(detail.id, cur)
    })
  })
  ;[...questionMap.entries()]
    .sort((a, b) => a[1].ok / a[1].draws - b[1].ok / b[1].draws)
    .forEach(([id, value]) => {
      const accuracy = value.draws > 0 ? Math.round((value.ok / value.draws) * 100) : 0
      rows.push({
        统计项: `题${id}（${value.type}）正确率`,
        数值: `${accuracy}%`,
        说明: `${value.question}｜参考答案：${value.expected}`,
      })
    })

  return rows
}

function toSummaryRows(records) {
  return records.map((item) => {
    const total = Number(item.totalCount ?? item.total ?? 0)
    const correct = Number(item.correctCount ?? item.score ?? 0)
    const accuracy = total > 0 ? `${Math.round((correct / total) * 100)}%` : ''
    return {
      姓名: item.name || '',
      专业班级: item.className || '',
      学号: item.studentId || '',
      答对题数: correct,
      总题数: total,
      正确率: accuracy,
      答题时间: formatTime(item.answeredAt || item.createdAt),
      数据来源: item.issueNumber ? `Gitee Issue #${item.issueNumber}` : '浏览器本地暂存',
    }
  })
}

function toDetailRows(records) {
  const rows = []
  records.forEach((item) => {
    const details = Array.isArray(item.details) ? item.details : []
    details.forEach((detail, index) => {
      rows.push({
        姓名: item.name || '',
        专业班级: item.className || '',
        学号: item.studentId || '',
        题序: index + 1,
        题目类型: detail.type || '',
        题目: detail.question || '',
        学生作答: detail.userAnswer || '（未作答）',
        正确答案: detail.expected || '',
        是否正确: detail.correct ? '正确' : '错误',
      })
    })
  })
  return rows
}

/**
 * 生成并下载 Excel（包含“成绩汇总”与“答题明细”两个工作表）
 * @param {Array} records 答题记录数组
 * @param {string} [filenamePrefix] 文件名前缀
 */
export function exportRecordsToExcel(records, filenamePrefix = '中秋灯谜答题成绩') {
  const raw = Array.isArray(records) ? records.filter(Boolean) : []
  if (raw.length === 0) {
    throw new Error('没有可导出的数据')
  }

  // 同一学号只保留一份（最高分；同分保留最早），并按「专业班级 → 姓名」排序（不做任何排名）
  const list = dedupeByStudent(raw).sort(
    (a, b) =>
      String(a.className || '').localeCompare(String(b.className || ''), 'zh-CN') ||
      String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'),
  )

  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.json_to_sheet(toSummaryRows(list))
  summarySheet['!cols'] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 22 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(workbook, summarySheet, '成绩明细')

  const detailRows = toDetailRows(list)
  if (detailRows.length > 0) {
    const detailSheet = XLSX.utils.json_to_sheet(detailRows)
    detailSheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
      { wch: 6 },
      { wch: 12 },
      { wch: 46 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(workbook, detailSheet, '答题明细')
  }

  const statsSheet = XLSX.utils.json_to_sheet(toStatsRows(list))
  statsSheet['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 62 }]
  XLSX.utils.book_append_sheet(workbook, statsSheet, '统计汇总')

  XLSX.writeFile(workbook, `${filenamePrefix}_${timestampSuffix()}.xlsx`)
  return { raw: raw.length, unique: list.length }
}
