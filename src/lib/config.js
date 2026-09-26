// 统一管理环境变量：所有 Vite 环境变量都必须以 VITE_ 开头才能在浏览器端读取
const env = import.meta.env || {}

/** Gitee 仓库鉴权与地址信息 */
export const GITEE = {
  owner: (env.VITE_GITEE_OWNER || '').trim(),
  repo: (env.VITE_GITEE_REPO || '').trim(),
  token: (env.VITE_GITEE_PAT || '').trim(),
  api: (env.VITE_GITEE_API || 'https://gitee.com/api/v5').replace(/\/+$/, ''),
}

/** 是否已完成 Gitee 配置（未配置时自动降级为本地暂存） */
export const isGiteeConfigured = Boolean(GITEE.owner && GITEE.repo)

/** 海报二维码使用的站点地址 */
function resolveSiteUrl() {
  const fromEnv = (env.VITE_SITE_URL || '').trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '')
  }
  return 'https://example.com'
}

export const SITE_URL = resolveSiteUrl()

/** 后台管理密码，默认 admin888 */
export const ADMIN_PASSWORD = (env.VITE_ADMIN_PASSWORD || 'admin888').trim()

/** Issue 标题统一前缀，便于后台筛选成绩记录 */
export const RECORD_TITLE_PREFIX = '[答题成绩]'

/** 活动默认截止时间：2026-09-28 00:00（北京时间，UTC+8） */
const DEFAULT_DEADLINE = '2026-09-28T00:00:00+08:00'

/** 活动截止时间（可用 .env 的 VITE_DEADLINE 覆盖，格式需为 ISO 8601，例如 2026-09-28T00:00:00+08:00） */
export const DEADLINE = (() => {
  const raw = (env.VITE_DEADLINE || DEFAULT_DEADLINE).trim()
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date(DEFAULT_DEADLINE) : parsed
})()

/** 活动是否已截止 */
export function isClosed(now = Date.now()) {
  return now >= DEADLINE.getTime()
}

/** 距截止的剩余毫秒数（已截止返回 0） */
export function remainingMs(now = Date.now()) {
  return Math.max(0, DEADLINE.getTime() - now)
}

/** 把截止时间显示为北京时间字符串（不受访问者时区影响） */
export function formatDeadline() {
  const beijing = new Date(DEADLINE.getTime() + (8 * 60 + DEADLINE.getTimezoneOffset()) * 60000)
  const pad = (value) => String(value).padStart(2, '0')
  return `${beijing.getFullYear()}-${pad(beijing.getMonth() + 1)}-${pad(beijing.getDate())} ${pad(
    beijing.getHours(),
  )}:${pad(beijing.getMinutes())}`
}

/** 把剩余毫秒数格式化为「x 小时 x 分 x 秒」 */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours} 小时 ${minutes} 分 ${seconds} 秒`
}
