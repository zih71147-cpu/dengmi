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

function toSummaryRows(records) {
  return records.map((item, index) => {
    const total = Number(item.totalCount ?? item.total ?? 0)
    const correct = Number(item.correctCount ?? item.score ?? 0)
    const accuracy = total > 0 ? `${Math.round((correct / total) * 100)}%` : ''
    return {
      序号: index + 1,
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
  const list = Array.isArray(records) ? records.filter(Boolean) : []
  if (list.length === 0) {
    throw new Error('没有可导出的数据')
  }

  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.json_to_sheet(toSummaryRows(list))
  summarySheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 22 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(workbook, summarySheet, '成绩汇总')

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

  XLSX.writeFile(workbook, `${filenamePrefix}_${timestampSuffix()}.xlsx`)
  return list.length
}
