# 中秋灯谜答题系统 🏮🌕

一个**纯静态、零后端**的中秋灯谜答题 SPA：填写姓名 / 专业班级 / 学号 → 随机抽 3 道灯谜（必含 1 道中秋习俗文化题）→ 自动判分 → 静默把成绩写入 Gitee Issue → 生成可长按保存的分享海报；管理端可一键拉取 Gitee 数据导出 Excel。

- 前端：React 19 + Vite 6
- 样式：Tailwind CSS 3.4（中秋夜色主题：圆月 / 祥云 / 宫灯，移动端竖屏适配，无横向滚动）
- 数据存储：Gitee Issues API（`fetch` 直连，电脑关机也能 24 小时收集数据）
- 海报：html2canvas + qrcode.react
- Excel：xlsx（SheetJS）
- 部署：纯静态产物 `dist/`，可部署到 Zeabur / Gitee Pages / 任意静态托管

---

## 一、目录结构

```
midautumn-riddle-quiz/
├─ index.html                 # 入口 HTML（中文标题 / 移动端 viewport / 主题色）
├─ vite.config.js             # base:'./' 便于子目录部署
├─ tailwind.config.js         # 中秋主题色板、字体、动画
├─ postcss.config.js
├─ .env.example               # 环境变量模板（复制为 .env 使用）
├─ .env                       # 本地变量（已 gitignore，不会提交）
└─ src/
   ├─ main.jsx
   ├─ App.jsx                 # 页面状态机 / 静默上传 / 隐藏后台入口
   ├─ index.css               # Tailwind 指令 + 卡片/按钮/输入框等组件类
   ├─ assets/riddles.json     # 内置题库：50 题（14 道“习俗文化”）
   ├─ components/
   │  ├─ NightSky.jsx         # 夜空背景：星星 + 圆月 + 祥云 + 宫灯
   │  └─ PosterCard.jsx       # 360px 固定尺寸分享海报（含二维码）
   ├─ lib/
   │  ├─ config.js            # 读取 .env（Gitee / 站点地址 / 管理密码）
   │  ├─ quiz.js              # 抽题（必含文化题）+ 答案归一化判分
   │  ├─ gitee.js             # Issues 创建（POST）与全量拉取（GET 分页）
   │  ├─ excel.js             # 成绩汇总 + 答题明细双工作表导出
   │  └─ storage.js           # 上传失败时的本地兜底暂存
   └─ pages/
      ├─ InfoPage.jsx         # 信息录入（三行输入框 + 必填校验）
      ├─ QuizPage.jsx         # 答题页（右下角悬浮“回答完毕”）
      ├─ ResultPage.jsx       # 结算 + 上传状态 + 海报生成
      └─ AdminPage.jsx        # 管理员控制台（拉取 / 导出 / 重试上传）
```

---

## 二、快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# 3. 启动开发服务器
npm run dev                 # http://localhost:5173

# 4. 生产构建（产物在 dist/，可直接上传静态托管）
npm run build
npm run preview
```

### .env 各项说明

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_GITEE_OWNER` | ✅ | Gitee 用户名或组织名，例如 `zhangsan` |
| `VITE_GITEE_REPO` | ✅ | 用于收集数据的**已存在**公开仓库名，例如 `midautumn-riddle-data` |
| `VITE_GITEE_PAT` | ✅ | Gitee 私人令牌，需勾选 `projects`（仓库读写）与 `issues`（Issue 读写） |
| `VITE_SITE_URL` | ⭕ | 海报二维码指向的地址；不填时自动取当前站点地址 |
| `VITE_ADMIN_PASSWORD` | ⭕ | 后台密码，默认 `admin888` |

> ⚠️ 未配置 Gitee 时系统仍可完整答题：成绩会暂存在浏览器本地，管理员在后台可“导出本机暂存成绩”或“重试上传”。

**创建 Gitee 令牌步骤**：头像 → 设置 → 安全设置 → 私人令牌 → 生成新令牌 → 勾选 `projects`、`issues` → 复制保存（只显示一次）。

**创建数据仓库**：在 Gitee 新建一个**公开**仓库（例如 `midautumn-riddle-data`，可勾选初始化 README），Issue 即作为答题记录表，首页 Issues 页可实时查看。

---

## 三、功能与交互流程

| 步骤 | 页面 | 说明 |
| --- | --- | --- |
| 1 | 信息录入（首页） | 半透明中秋卡片，方框内三行输入框（姓名 / 专业班级 / 学号），任一为空即提示并聚焦，通过后进入答题 |
| 2 | 答题 | 随机抽 3 题（**必含 ≥1 道“习俗文化”题**），每题下方独立输入框；右下角**悬浮「回答完毕」**按钮；有未作答题目时首次点击仅提醒 |
| 3 | 判分 | 前端即时比对：去空格/标点、去口语前缀、忽略大小写；支持**标准答案命中**与**核心词命中**（单字答案须完全一致） |
| 4 | 结算 | 展示答对题数 / 正确率 / 逐题解析，同时**静默写入 Gitee**：Issue 优先 → 失败自动降级写仓库数据文件 `records.json` → 仍失败才存浏览器本地 |
| 5 | 海报 | 「生成分享海报」用 html2canvas 截图 360px 海报（成绩 + 中秋祝福语 + 站点 URL 二维码），手机端长按图片即可保存 |
| 6 | 后台 | 首页**左下角**极隐蔽的 🌙 图标 → 密码 `admin888` → 一键拉取 Gitee Issues → 一键导出 Excel |

### 判分细节（`src/lib/quiz.js`）

- 归一化：删除所有空白与中英文标点、去掉“答案是/谜底是”等前缀、全角数字转半角、统一小写。
- 命中规则：① 与任一标准答案完全相同；② 与标准答案互为包含（长度 ≥ 2）；③ 命中 `keywords` 核心词。
- 例：题 22 答案为「对影成三人」，作答“对影成三人”“成三人”“三人”均判对；题 25 答案「告」，只认“告”。

### 抽题细节（`src/lib/quiz.js` → `pickQuestions`）

1. 从 `type === "习俗文化"` 的题中随机取 1 道；
2. 从其余题库随机补足到 3 道；
3. 顺序打乱后返回，保证“必有文化题”且题目不重复。

---

## 四、Gitee 数据格式

- **Issue 标题**：`[答题成绩] {姓名} - {专业班级}`
- **Issue 正文（body）**：一条标准 JSON 字符串

```json
{
  "name": "张三",
  "className": "计算机科学与技术2301班",
  "studentId": "20230101",
  "correctCount": 2,
  "totalCount": 3,
  "accuracy": 67,
  "answeredAt": "2026-09-25T12:34:56.000Z",
  "siteUrl": "https://your-site.example.com",
  "details": [
    {
      "id": 2,
      "type": "习俗文化",
      "question": "中秋节最具代表性的传统食品是什么？",
      "userAnswer": "月饼",
      "expected": "月饼",
      "correct": true
    }
  ]
}
```

后台导出 Excel 时会读取 `correctCount` / `totalCount` / `answeredAt` 等字段，并生成 **成绩汇总** 与 **答题明细** 两个工作表；非 `[答题成绩]` 前缀的 Issue 会被自动跳过。

### 双通道存储（Issue 优先，自动降级，数据不丢）

| 通道 | 落点 | 触发条件 |
| --- | --- | --- |
| ① Issue | 仓库 Issues，标题 `[答题成绩] 姓名 - 专业班级`，body 为标准 JSON | 默认通道（需令牌具备 `issues` 权限且 Gitee 接口可用） |
| ② 数据文件 | 仓库根目录 `records.json`（JSON 数组，每条记录一条） | ① 失败时自动降级；前端先读取 sha 再 PUT 写回，冲突自动重试 2 次 |
| ③ 浏览器本地 | `localStorage` 暂存队列 | ①② 都失败时兜底；后台可「重试上传本机成绩」或直接导出 |

后台「一键拉取 Gitee 数据」会同时读取 ①②，并按「学号 + 答题时间」去重合并（Issue 记录优先），导出 Excel 时两条通道的数据都会被包含；预览列表会标注每条数据来自哪个通道（`Gitee Issue #N` / `仓库数据文件 records.json` / `本机暂存`）。

> ⚠️ 实测记录：本账号调用 Gitee 的 **创建 Issue 接口**会持续返回 `404 {"message":"project or enterprise"}`（已排除令牌权限、公开私有、请求编码、参数形态等因素，属 Gitee 服务端限制），因此系统实际运行在 ② `records.json` 通道上；数据完整性与导出功能不受影响。若 Gitee 之后恢复该接口，系统会自动切回 ①。

---

## 五、部署

### 方式一：Zeabur（推荐，支持环境变量）

1. 把项目推到 GitHub / Gitee / GitLab 仓库；
2. Zeabur → 新建项目 → 从 Git 部署 → 选择该仓库；
3. 构建命令 `npm run build`，输出目录 `dist`，类型选择 **静态网站 / Static**；
4. 在 **Variables** 里添加 `VITE_GITEE_OWNER`、`VITE_GITEE_REPO`、`VITE_GITEE_PAT`、`VITE_SITE_URL`、`VITE_ADMIN_PASSWORD`；
5. 部署完成后把 `VITE_SITE_URL` 改成正式域名，重新部署（海报二维码会随之更新）。

> 注意：Vite 的环境变量在**构建期**注入，修改 Variables 后必须重新构建。

### 方式二：Gitee Pages

1. 新建仓库 → 上传本项目代码（`.env` 不会提交，请在本地先配置好再构建）；
2. 本地 `npm run build`，把 `dist/` 内文件推到仓库的 `master` 分支（或 `docs/` 目录）；
3. Gitee 仓库 → 服务 → Gitee Pages → 部署分支选 `master`（目录 `/` 或 `/docs`）→ 部署；
4. 因为 `vite.config.js` 里 `base: './'`，无需额外配置子路径；本站通过页面状态切换而不是路由跳转，**无需 301/重写规则**。

### 方式三：任意静态托管（Vercel / Netlify / Nginx / 对象存储）

直接上传 `dist/` 目录即可；`index.html` + 相对路径资源，无服务端依赖。

---

## 六、常见问题

1. **上传失败 / 提示“已保存在本机”**：进入后台（首页左下角 🌙 图标 → 密码）先点 **「连接自检（只读）」**，它会逐项检测环境变量 → 令牌 → 仓库读取 → Issue 读取，并原样显示 Gitee 返回的错误信息；再点 **「写入自检（建测试 Issue）」** 可验证浏览器跨域与写入权限（该测试 Issue 会自动被关闭，且标题不含 `[答题成绩]`，导出 Excel 时会自动跳过）。仍失败时的记录不会丢，后台可“重试上传本机成绩”。
2. **创建 Issue 报 `{"message":"project or enterprise"}`（或 `Not Found Project`）**：属于 Gitee 服务端对该接口的限制/异常（已在 10 余种请求姿势下复现，与令牌权限、仓库公开状态无关）。**系统已内置降级方案，无需处理**：成绩会自动写入仓库数据文件 `records.json`，后台拉取与 Excel 导出都包含这些数据；你也可以到 https://gitee.com/profile/security 完成 **2FA 或绑定第三方账号**、并确认令牌勾选了 `projects` + `issues`，若接口恢复系统会自动切回 Issue 通道。另外，公开仓库被拒（422）时的提示原文正是账号安全评级问题，按上述方式处理即可。
3. **手机端出现横向滚动**：全局已设置 `overflow-x: hidden`，背景装饰元素均放在 `overflow-hidden` 容器中；如自行新增装饰，请避免使用固定像素宽度 + 负 `left/right`。
4. **海报生成空白**：html2canvas 需在元素真实渲染后截图，当前实现已用离屏容器 + `scale: 2`；若浏览器版本过旧，可降级提示用户直接截图。
5. **修改密码**：编辑 `.env` 的 `VITE_ADMIN_PASSWORD`（默认 `admin888`），重启/重新构建生效。
6. **扩充题库**：编辑 `src/assets/riddles.json`，按现有字段追加即可（`id` 唯一、`type` 类型、`answers` 标准答案数组、`keywords` 核心词数组、`explain` 解析）。
7. **调整抽题数量**：修改 `src/lib/quiz.js` 中 `DRAW_COUNT`（默认 3）；若想强制多道文化题，可在 `pickQuestions` 中增加文化题抽取次数。

---

## 七、脚本命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器（HMR） |
| `npm run build` | 生产构建，产物 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run lint` | ESLint 检查 |

祝你月圆人团圆，答题顺利！🌕

