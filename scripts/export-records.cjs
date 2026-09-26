/**
 * 一键导出答题成绩（同一学号只保留一份，不含排名）
 *
 * 用法：node scripts/export-records.cjs [输出目录]
 * 输出到指定目录（默认桌面）：
 *   - 中秋灯谜_成绩明细_<时间>.xlsx   （工作表：成绩明细 / 答题明细 / 统计汇总）
 *   - 中秋灯谜_成绩明细_<时间>.csv    （去重后的表格，Excel 可直接打开）
 */
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const TOKEN = process.env.GITEE_TOKEN || 'e721094fafaa02dc12b87e39c10ced66'
const BASE = process.env.GITEE_BASE || 'https://gitee.com/api/v5/repos/szh060422/midautumn-riddle-data'
const OUT_DIR = process.argv[2] || path.join(os.homedir(), 'Desktop')
const STAMP = new Date().toISOString().slice(0, 16).replace(/[:T-]/g, '')

async function main() {
  if (!fs.existsSync(OUT_DIR)) throw new Error(`输出目录不存在：${OUT_DIR}`)

  const res = await fetch(`${BASE}/contents/records.json?access_token=${TOKEN}`)
  if (!res.ok) throw new Error(`拉取数据失败 HTTP ${res.status}`)
  const data = await res.json()
  const raw = JSON.parse(Buffer.from(String(data.content).replace(/\s/g, ''), 'base64').toString('utf8'))

  const { dedupeByStudent, exportRecordsToExcel, formatTime } = await import(
    pathToFileURL(path.join(__dirname, '..', 'src', 'lib', 'excel.js')).href
  )

  // 同一学号只保留一份（最高分；同分保留最早），按班级+姓名排序（不做排名）
  const unique = dedupeByStudent(raw).sort(
    (a, b) =>
      String(a.className || '').localeCompare(String(b.className || ''), 'zh-CN') ||
      String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'),
  )

  const result = exportRecordsToExcel(raw, path.join(OUT_DIR, '中秋灯谜_成绩明细'))

  const head = ['姓名', '专业班级', '学号', '答对题数', '总题数', '正确率', '答题时间']
  const scoreOf = (item) => Number(item.correctCount ?? item.score ?? 0)
  const totalOf = (item) => Number(item.totalCount ?? item.total ?? 0)
  const csv = [head.join(',')]
    .concat(
      unique.map((item) =>
        [
          item.name,
          item.className,
          item.studentId,
          scoreOf(item),
          totalOf(item),
          totalOf(item) > 0 ? `${Math.round((scoreOf(item) / totalOf(item)) * 100)}%` : '',
          formatTime(item.answeredAt),
        ]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    )
    .join('\r\n')
  fs.writeFileSync(path.join(OUT_DIR, `中秋灯谜_成绩明细_${STAMP}.csv`), `\ufeff${csv}`, 'utf8')

  console.log(`EXPORT_OK raw=${result.raw} unique=${result.unique} dir=${OUT_DIR}`)
}

main().catch((error) => {
  console.log(`EXPORT_FAIL ${error.message}`)
  process.exit(1)
})
