import { GITEE, RECORD_TITLE_PREFIX, isGiteeConfigured } from './config'

const TIMEOUT_MS = 20000
const PER_PAGE = 100
const MAX_PAGES = 20

export { isGiteeConfigured }

function buildUrl(path, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  return `${GITEE.api}${path}${query}`
}

async function request(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('请求 Gitee 超时，请检查网络后重试。')
    }
    if (error instanceof TypeError) {
      throw new Error('无法访问 Gitee 接口（可能被浏览器跨域策略拦截或网络不可达）')
    }
    throw new Error(`请求 Gitee 失败：${error?.message || '未知错误'}`)
  } finally {
    clearTimeout(timer)
  }
}

async function readError(res) {
  let text = ''
  try {
    text = await res.text()
  } catch {
    text = ''
  }
  const brief = text.replace(/\s+/g, ' ').slice(0, 180)
  return `Gitee 接口返回 ${res.status}${brief ? `：${brief}` : ''}`
}

/** 备用存储：仓库内的数据文件（Issue 接口不可用时自动降级使用） */
const RECORDS_PATH = 'records.json'

function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64Utf8(base64) {
  const binary = atob(String(base64).replace(/\s+/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function repoPath() {
  return `/repos/${encodeURIComponent(GITEE.owner)}/${encodeURIComponent(GITEE.repo)}`
}

/**
 * 读取仓库数据文件 records.json
 * @returns {Promise<{records:Array, sha:string|null}>}
 */
export async function fetchRecordsFile() {
  if (!isGiteeConfigured) throw new Error('尚未配置 Gitee 仓库（VITE_GITEE_OWNER / VITE_GITEE_REPO）')

  const res = await request(buildUrl(`${repoPath()}/contents/${RECORDS_PATH}`, { access_token: GITEE.token }))
  if (res.status === 404) return { records: [], sha: null }
  if (!res.ok) throw new Error(await readError(res))

  const data = await res.json()
  let records = []
  try {
    const parsed = JSON.parse(decodeBase64Utf8(data.content || ''))
    if (Array.isArray(parsed)) records = parsed
  } catch {
    records = []
  }
  return { records, sha: data.sha || null }
}

/**
 * 追加一条记录到仓库数据文件（先读 sha 再写入，冲突自动重试）
 * @param {object} record 答题记录
 * @param {number} attempt 内部重试计数
 */
export async function appendRecordToFile(record, attempt = 0) {
  const { records, sha } = await fetchRecordsFile()
  const next = [...records, record]

  const payload = {
    access_token: GITEE.token,
    content: encodeBase64Utf8(JSON.stringify(next, null, 2)),
    message: `record: ${record.name || 'unknown'} ${record.answeredAt || ''}`.trim(),
    branch: 'master',
  }
  if (sha) payload.sha = sha

  const res = await request(buildUrl(`${repoPath()}/contents/${RECORDS_PATH}`), {
    method: sha ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const message = await readError(res)
    // 并发写入导致 sha 过期时重试
    if (attempt < 2 && /conflict|409|sha/i.test(message)) {
      return appendRecordToFile(record, attempt + 1)
    }
    throw new Error(message)
  }

  return { total: next.length, sha: (await res.json().content || {}).sha || null }
}

/**
 * 保存答题记录：优先写入 Gitee Issue，失败自动降级到仓库数据文件
 * @returns {Promise<{backend:'issue'|'file', issueError?:string}>}
 */
export async function saveRecord(record) {
  try {
    await createRecordIssue(record)
    return { backend: 'issue' }
  } catch (issueError) {
    try {
      await appendRecordToFile(record)
      return { backend: 'file', issueError: issueError.message }
    } catch (fileError) {
      throw new Error(`${issueError.message}；仓库数据文件写入也失败：${fileError.message}`)
    }
  }
}

/**
 * 创建 Issue 上传答题记录（静默上传，失败时由调用方降级到本地暂存）
 * @param {object} record 答题记录对象
 */
export async function createRecordIssue(record) {
  if (!isGiteeConfigured) {
    throw new Error('尚未配置 Gitee 仓库（VITE_GITEE_OWNER / VITE_GITEE_REPO）')
  }

  const url = buildUrl(
    `/repos/${encodeURIComponent(GITEE.owner)}/${encodeURIComponent(GITEE.repo)}/issues`,
  )

  const payload = {
    access_token: GITEE.token,
    title: `${RECORD_TITLE_PREFIX} ${record.name} - ${record.className}`,
    // body 统一存放标准 JSON 字符串，后台按 JSON 解析即可
    body: JSON.stringify(record),
  }

  const res = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await readError(res))
  }

  return res.json()
}

/** 解析单条 Issue，返回答题记录（非成绩 Issue 或不合法 JSON 返回 null） */
function parseRecordIssue(issue) {
  const title = issue?.title || ''
  if (!title.includes(RECORD_TITLE_PREFIX)) return null

  try {
    const parsed = JSON.parse(issue.body || '{}')
    if (!parsed || typeof parsed !== 'object') return null
    return {
      ...parsed,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      issueTitle: title,
      createdAt: issue.created_at,
    }
  } catch {
    return null
  }
}

/**
 * 全量拉取仓库 Issues 中的答题记录
 * @param {(loaded:number)=>void} [onProgress] 进度回调
 * @returns {Promise<{records:Array, issuesCount:number, skipped:number}>}
 */
export async function fetchAllRecords(onProgress) {
  if (!isGiteeConfigured) {
    throw new Error('尚未配置 Gitee 仓库（VITE_GITEE_OWNER / VITE_GITEE_REPO）')
  }

  const issues = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = {
      state: 'all',
      sort: 'created',
      direction: 'desc',
      per_page: String(PER_PAGE),
      page: String(page),
    }
    if (GITEE.token) params.access_token = GITEE.token

    const res = await request(
      buildUrl(`/repos/${encodeURIComponent(GITEE.owner)}/${encodeURIComponent(GITEE.repo)}/issues`, params),
    )

    if (!res.ok) {
      throw new Error(await readError(res))
    }

    const list = await res.json()
    if (!Array.isArray(list) || list.length === 0) break

    issues.push(...list)
    if (typeof onProgress === 'function') onProgress(issues.length)
    if (list.length < PER_PAGE) break
  }

  const records = []
  let skipped = 0

  issues.forEach((issue) => {
    const record = parseRecordIssue(issue)
    if (record) records.push(record)
    else skipped += 1
  })

  // 备用通道：仓库数据文件中的记录（Issue 写入不可用时由前端自动降级写入）
  let fileCount = 0
  let fileError = ''
  try {
    const file = await fetchRecordsFile()
    fileCount = file.records.length
    file.records.forEach((record) => records.push({ ...record, source: 'file' }))
  } catch (error) {
    fileError = error.message
  }

  // 按「学号 + 答题时间」去重，Issue 记录优先
  const merged = []
  const seen = new Set()
  records.forEach((record) => {
    const key = `${record.studentId || ''}|${record.answeredAt || ''}`
    if (seen.has(key)) return
    seen.add(key)
    merged.push({ ...record, source: record.source || 'issue' })
  })

  return { records: merged, issuesCount: issues.length, skipped, fileCount, fileError }
}

/**
 * 连接自检（只读）：逐项检测令牌、仓库与 Issue 读取权限
 * 可在浏览器中直接运行，用于排查跨域/权限问题
 * @returns {Promise<Array<{name:string, ok:boolean, message:string}>>}
 */
export async function probeConnection() {
  const steps = []
  const push = (name, ok, message) => steps.push({ name, ok, message })

  if (!isGiteeConfigured) {
    push('环境变量', false, '未配置 VITE_GITEE_OWNER / VITE_GITEE_REPO')
    return steps
  }
  push('环境变量', true, `仓库 ${GITEE.owner}/${GITEE.repo}；令牌${GITEE.token ? '已配置' : '未配置'}`)

  // 1. 令牌校验
  try {
    const res = await request(buildUrl('/user', { access_token: GITEE.token }))
    if (!res.ok) throw new Error(await readError(res))
    const user = await res.json()
    push('令牌校验 GET /user', true, `已登录：${user.login || user.name || '未知用户'}`)
  } catch (error) {
    push('令牌校验 GET /user', false, error.message)
  }

  const repoPath = `/repos/${encodeURIComponent(GITEE.owner)}/${encodeURIComponent(GITEE.repo)}`

  // 2. 仓库读取权限
  try {
    const params = GITEE.token ? { access_token: GITEE.token } : {}
    const res = await request(buildUrl(repoPath, params))
    if (!res.ok) throw new Error(await readError(res))
    const repo = await res.json()
    push(
      '仓库读取 GET /repos/...',
      true,
      `${repo.name}｜${repo.private ? '私有仓库' : '公开仓库'}｜Issue 功能${repo.has_issues ? '已开启' : '未开启'}`,
    )
  } catch (error) {
    push('仓库读取 GET /repos/...', false, error.message)
  }

  // 3. Issue 读取权限
  try {
    const params = { state: 'all', per_page: '1', page: '1' }
    if (GITEE.token) params.access_token = GITEE.token
    const res = await request(buildUrl(`${repoPath}/issues`, params))
    if (!res.ok) throw new Error(await readError(res))
    const list = await res.json()
    push('Issue 读取 GET /issues', true, `可读取，当前返回 ${Array.isArray(list) ? list.length : 0} 条`)
  } catch (error) {
    push('Issue 读取 GET /issues', false, error.message)
  }

  // 4. 备用通道：仓库数据文件（成绩降级写入处）
  try {
    const file = await fetchRecordsFile()
    push(
      '备用通道 records.json',
      true,
      file.sha ? `已存在，包含 ${file.records.length} 条记录` : '文件尚未创建（提交第一条成绩时自动创建）',
    )
  } catch (error) {
    push('备用通道 records.json', false, error.message)
  }

  return steps
}

/**
 * 写入自检：创建一条测试 Issue 并立刻关闭（仅用于验证浏览器端写入权限与跨域）
 * 标题带 [连接自检] 前缀，后台导出 Excel 时会自动跳过
 */
export async function createSelfTestIssue() {
  if (!isGiteeConfigured) {
    throw new Error('尚未配置 Gitee 仓库（VITE_GITEE_OWNER / VITE_GITEE_REPO）')
  }

  const repoPath = `/repos/${encodeURIComponent(GITEE.owner)}/${encodeURIComponent(GITEE.repo)}`
  const now = new Date().toISOString()

  const createRes = await request(buildUrl(`${repoPath}/issues`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({
      access_token: GITEE.token,
      title: `[连接自检] ${now}`,
      body: JSON.stringify({ type: 'connection-test', createdAt: now }),
    }),
  })
  if (!createRes.ok) throw new Error(`创建测试 Issue 失败 → ${await readError(createRes)}`)

  const issue = await createRes.json()

  // 创建成功后立即关闭，避免污染成绩列表
  try {
    const closeRes = await request(buildUrl(`${repoPath}/issues/${issue.number}`, { access_token: GITEE.token }), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ state: 'closed' }),
    })
    if (!closeRes.ok) throw new Error(await readError(closeRes))
    return { number: issue.number, closed: true }
  } catch (error) {
    return { number: issue.number, closed: false, closeError: error.message }
  }
}
