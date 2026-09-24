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
