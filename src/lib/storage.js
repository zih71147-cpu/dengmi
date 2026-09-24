// 本地兜底存储：当 Gitee 未配置或上传失败时，先把成绩暂存在浏览器里，
// 管理员可在后台一键重试上传或直接导出为 Excel，保证数据不丢。
const STORAGE_KEY = 'midautumn-quiz::local-records::v1'

function safeParse(raw) {
  try {
    const data = JSON.parse(raw || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** 读取本地暂存记录（按答题时间倒序） */
export function loadLocalRecords() {
  if (typeof localStorage === 'undefined') return []
  const list = safeParse(localStorage.getItem(STORAGE_KEY))
  return [...list].sort((a, b) => String(b.answeredAt || '').localeCompare(String(a.answeredAt || '')))
}

function writeAll(list) {
  if (typeof localStorage === 'undefined') return list
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 超出配额时静默失败，不影响答题流程
  }
  return list
}

/** 新增一条本地暂存记录 */
export function saveLocalRecord(record) {
  const withId = {
    ...record,
    recordId: record.recordId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pendingUpload: true,
  }
  const list = loadLocalRecords().filter((item) => item.recordId !== withId.recordId)
  list.push(withId)
  writeAll(list)
  return withId
}

/** 删除指定本地记录（上传成功后调用） */
export function removeLocalRecord(recordId) {
  const list = loadLocalRecords().filter((item) => item.recordId !== recordId)
  return writeAll(list)
}

/** 清空本地暂存 */
export function clearLocalRecords() {
  return writeAll([])
}
