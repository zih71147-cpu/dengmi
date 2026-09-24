import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base 使用相对路径：既能部署到 Gitee Pages 的子目录，也能部署到 Zeabur 等根目录环境
// 项目为纯静态 SPA，无路由库，所有页面切换都在前端完成，静态托管无需 rewrite 规则
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
})
