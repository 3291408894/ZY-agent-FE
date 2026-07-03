# 智翼平台前端基础层 — 交付报告

> **交付日期**：2026-07-03  
> **交付范围**：PBI_02 导航布局 + PBI_03 UI 主题  
> **项目路径**：`D:\VScode\zy-fe\frontend\`  
> **技术栈**：Vue 3.4+ · TypeScript 5.x · Vite 8.x · Element Plus · Pinia · Vue Router 4 · SCSS

---

## 一、交付物总览

```
frontend/
├── CLAUDE.md                          ← ★ 前端开发指南（必读）
│
├── src/
│   ├── assets/styles/
│   │   ├── variables.scss             ← ★ 设计令牌（所有颜色/字体/间距的定义源）
│   │   ├── mixins.scss                ← 响应式/文本截断/卡片等工具 Mixin
│   │   ├── element-plus-override.scss ← Element Plus → 护眼配色的映射
│   │   └── global.scss                ← 全局 Reset + 通用工具类
│   │
│   ├── components/layout/
│   │   ├── AppLayout.vue              ← ★ 主布局容器（全屏页 vs 标准页）
│   │   ├── AppHeader.vue              ← ★ 顶部导航栏
│   │   ├── AppSidebar.vue             ← ★ 侧边导航栏
│   │   └── AppFooter.vue              ← 底部栏
│   │
│   ├── router/index.ts               ← ★ 路由配置 + 导航守卫
│   ├── stores/theme.ts               ← ★ 主题状态（字体/模式/配色）
│   ├── stores/user.ts                ← 用户状态
│   ├── types/index.ts                ← ★ 全局 TS 类型（与后端对齐）
│   │
│   ├── api/
│   │   ├── request.ts                ← ★ Axios 封装（拦截器/Token/错误处理）
│   │   └── modules/                  ← 6 个业务模块 API
│   │
│   ├── composables/
│   │   ├── useAuth.ts                ← 认证逻辑
│   │   ├── useTheme.ts               ← 主题切换
│   │   ├── useFontSize.ts            ← 字体三档调节
│   │   └── useSSE.ts                 ← ★ SSE 流式响应（Agent/总结/出题通用）
│   │
│   └── views/                        ← 8 个页面（含骨架占位）
│       ├── auth/                     ← 登录/注册/忘记密码（完整）
│       ├── dashboard/                ← 学习仪表盘（骨架就绪）
│       ├── agent/                    ← AI 助手（骨架就绪）
│       ├── summary/                  ← 课文总结（骨架）
│       ├── exercise/                 ← 习题练习（骨架，Sprint 2）
│       ├── files/                    ← 文件管理（骨架，Sprint 2）
│       └── knowledge/                ← 知识图谱（骨架，Sprint 2）
│
├── .env / .env.production           ← 环境变量
├── .eslintrc.cjs                     ← ESLint 配置
├── .prettierrc.json                  ← Prettier 配置
└── vite.config.ts                    ← Vite 配置（别名/代理/分包）
```

---

## 二、为后续开发者指明道路

### 2.1 入手指南（10 分钟上手）

```bash
# 1. 进入项目
cd D:\VScode\zy-fe\frontend

# 2. 安装依赖（首次）
npm install

# 3. 启动开发服务器
npm run dev
# → 浏览器自动打开 http://localhost:5173
# → 后端 API 代理到 http://localhost:8000
```

### 2.2 必读文件（按顺序）

| 优先级 | 文件 | 内容 |
|--------|------|------|
| ★★★ | `CLAUDE.md` | 项目架构、命名规范、开发约定 |
| ★★★ | `src/assets/styles/variables.scss` | 所有设计令牌（颜色/字体/间距/阴影） |
| ★★☆ | `src/types/index.ts` | 全局类型定义，与后端 Schema 一一对应 |
| ★★☆ | `src/router/index.ts` | 路由表，新增页面在此注册 |
| ★☆☆ | `智翼平台开发规范与接口文档.md`（桌面） | 后端 API 文档，前端以此为准 |

### 2.3 开发工作流

```
┌─ 需求 ─────────────────────────────────────────────┐
│                                                      │
│  1. 确认后端 Schema（桌面开发规范文档第五～六章）     │
│                          │                           │
│  2. 在 types/index.ts 中新增类型定义                 │
│                          │                           │
│  3. 在 api/modules/<模块>.ts 中新增 API 函数         │
│     · 普通接口 → 用 Axios（get/post/put/del）        │
│     · 流式接口 → 用 useSSE() composable              │
│                          │                           │
│  4. 在 router/index.ts 中注册路由                    │
│                          │                           │
│  5. 在 views/<模块>/ 中创建页面组件                   │
│                          │                           │
│  6. 需要跨组件状态 → 在 stores/ 中新增 Pinia Store   │
│     · 不需要跨组件 → 组件内 ref/reactive 即可         │
│                          │                           │
│  7. 联调前确认 .env 中 VITE_API_BASE_URL 指向正确后端  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2.4 核心规范速查表

| 分类 | 规范 | 示例 |
|------|------|------|
| **组件文件** | PascalCase | `KnowledgeGraph.vue` |
| **TS/JS 文件** | camelCase | `useAuth.ts`, `request.ts` |
| **CSS class** | kebab-case | `.chat-message__content` |
| **路由 path** | kebab-case | `/knowledge-graph` |
| **TypeScript 接口** | `I` 前缀 | `IUser`, `IExercise` |
| **常量** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| **Vue 写法** | `<script setup lang="ts">` | 强制 Composition API |
| **组件拆分** | 页面(views) → 组装; 逻辑 → composables; UI → components | |
| **颜色/字体** | 只用 CSS 变量，不写死色值 | `var(--color-primary)` |
| **状态管理** | 跨组件 → Pinia; 页面内 → ref/reactive | |
| **API 调用** | 普通 → `api/modules/`; 流式 → `useSSE()` | |

### 2.5 已预留的拓展点

| 位置 | 用途 | 何时使用 |
|------|------|---------|
| `components/common/` | 通用 UI 组件（按钮/弹窗/空状态...） | 发现 ≥2 个页面复用时提取 |
| `components/business/` | 业务组件（文件上传卡片/习题卡片...） | 业务逻辑 + UI 复用时提取 |
| `stores/agent.ts` | AI Agent 状态（会话/消息/流式） | PBI_04 开发时启用 |
| `api/modules/` 的 SSE 注释 | 标注了哪些接口走 SSE | 对接 Agent/总结/出题流式接口时 |
| `[data-theme='dark']` | 暗色模式 | PBI_03 主题切换扩展 |
| `env.d.ts` | 环境变量类型 | 新增 `VITE_*` 环境变量时补充 |

### 2.6 对接后端接口的执行清单

在联调前，确认以下事项：

- [ ] 已拉取最新代码
- [ ] `.env` 中 `VITE_API_BASE_URL` 指向正确的后端地址
- [ ] 后端已执行 `alembic upgrade head`
- [ ] 阅读了 `智翼平台开发规范与接口文档.md` 中对应模块的 API Schema
- [ ] `types/index.ts` 中的类型与后端 Pydantic Schema 对齐（字段名、枚举值、可选/必填）
- [ ] SSE 接口使用了 `useSSE()` composable 而非 Axios
- [ ] Mock 数据已移除或通过 `VITE_USE_MOCK` 控制
- [ ] 联调完成后删除 `api/mock/` 中的临时 Mock 文件

---

## 三、PBI_02 导航布局 — 设计说明

### 3.1 两种布局模式

```
┌─ 全屏布局（登录/注册/忘记密码） ─┐
│                                    │
│         ┌──────────────┐           │
│         │   页面内容     │           │
│         │   (居中卡片)   │           │
│         └──────────────┘           │
│                                    │
│  无 Header / 无 Sidebar / 无 Footer │
└────────────────────────────────────┘

┌─ 标准布局（仪表盘/AI助手/总结...） ──────────┐
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  AppHeader（固定顶部，56px）               │  │
│  │  Logo | 字体调节 | 主题切换 | 用户菜单     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──Sidebar──┐ ┌────────────────────────────┐  │
│  │ 仪表盘     │ │                            │  │
│  │ AI 助手    │ │   <router-view />          │  │
│  │ 课文总结   │ │   页面内容区                 │  │
│  │ 习题 [即将]│ │   (max-width: 1200px)      │  │
│  │ 文件 [即将]│ │                            │  │
│  │ 知识图谱   │ │                            │  │
│  │            │ │                            │  │
│  │ Sprint进度 │ │                            │  │
│  └────────────┘ ├────────────────────────────┤  │
│                  │  AppFooter（48px）          │  │
│                  └────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### 3.2 响应式断点

| 断点 | 宽度 | 行为 |
|------|------|------|
| **PC** | ≥ 1024px | 完整布局，侧边栏 220px / 折叠 64px |
| **平板** | 768~1023px | 侧边栏默认折叠，内容区全宽 |
| **手机** | < 768px | 侧边栏隐藏（遮罩层弹出），字体调节隐藏，底部栏纵向排列 |

### 3.3 导航菜单定义

| 导航项 | 路由 | PBI | Sprint |
|--------|------|-----|--------|
| 学习仪表盘 | `/dashboard` | PBI_02 | 1 |
| AI 助手 | `/agent` | PBI_04 | 1 |
| 课文总结 | `/summary` | PBI_06 | 1 |
| 习题练习 | `/exercise` | PBI_08/09/10 | 2 |
| 文件管理 | `/files` | PBI_05 | 2 |
| 知识图谱 | `/knowledge` | PBI_11 | 2 |

Sprint 2 的导航项标注了「即将上线」标签，点击仍可进入查看骨架页。

### 3.4 路由守卫逻辑

```
用户访问 /dashboard 等需登录页面
  ├── 有 Token → 正常访问
  └── 无 Token → 重定向 /login?redirect=/dashboard

用户访问 /login 等认证页面
  ├── 已登录 → 重定向 /dashboard
  └── 未登录 → 正常访问
```

---

## 四、PBI_03 UI 主题 — 设计说明

### 4.1 护眼配色方案

| 设计令牌 | 色值 | 用途 |
|----------|------|------|
| `--color-primary` | `#5B9BD5` | 主色：柔和蓝 |
| `--color-primary-light` | `#E8F0FE` | 浅蓝背景（选中态） |
| `--color-bg` | `#F5F3EE` | 页面背景：米白护眼 |
| `--color-bg-card` | `#FFFFFF` | 卡片背景 |
| `--color-text` | `#333333` | 正文色 |
| `--color-text-secondary` | `#666666` | 辅助文字 |
| `--color-border` | `#E4E7ED` | 边框色 |
| `--color-success` | `#67C23A` | 成功绿 |
| `--color-warning` | `#E6A23C` | 警告橙 |
| `--color-danger` | `#F56C6C` | 危险红 |

**核心原则**：低对比度、柔和色调、减少视觉疲劳。所有组件必须通过 CSS 变量引用颜色，严禁硬编码色值。

### 4.2 字体三档调节

| 档位 | 字号 | 适用场景 |
|------|------|---------|
| 小 | 13px | 高密度信息浏览、数据列表 |
| **中（默认）** | **15px** | **日常学习使用** |
| 大 | 17px | 长时间阅读、减缓眼疲劳 |

**实现方式**：用户操作 → `useThemeStore().setFontSize()` → 修改 `document.documentElement.style.setProperty('--font-size-base', value)` → 所有基于 `--font-size-base` 的 CSS 变量自动级联更新。

**交互入口**（AppHeader 工具栏）：
```
[缩小 A⁻] [字号下拉] [放大 A⁺]      ☀/🌙       👤用户名 ▼
```

### 4.3 暗色模式（已预留）

通过 `<html data-theme="dark">` 切换，CSS 变量在 `variables.scss` 中已完整定义暗色方案。切换入口在 Header 的太阳/月亮图标按钮。

```scss
// 使用方式：
[data-theme='dark'] {
  --color-bg: #1a1a2e;
  --color-bg-card: #252545;
  // ... 全部暗色变量
}
```

### 4.4 设计令牌完整清单

除了颜色和字体，还定义了以下可复用的设计令牌：

| 类别 | 示例变量 | 值 |
|------|---------|-----|
| **间距** | `--spacing-xs` ~ `--spacing-xxxl` | 4px ~ 48px（基于 4px 栅格） |
| **圆角** | `--radius-sm` ~ `--radius-xl` | 4px ~ 16px |
| **阴影** | `--shadow-sm` ~ `--shadow-xl` | 5 级深度 |
| **过渡** | `--transition-fast` / `base` / `slow` | 0.15s / 0.25s / 0.4s |
| **层级** | `--z-sidebar`(100) ~ `--z-tooltip`(3000) | Z-index 管理 |

所有值在 `variables.scss` 中统一定义，一处修改，全局生效。

---

## 五、API 请求层说明

### 5.1 Axios 封装 (request.ts)

```
请求 → [拦截器] 自动注入 Bearer Token → 发送
响应 → [拦截器] 解包 data → 检查 code → 返回
                   │
                   ├── code=0 → 返回 data
                   ├── 401 → 清除 Token → 跳转 /login
                   ├── 403/404/429/500 → ElMessage 提示
                   └── 网络错误 → ElMessage 提示
```

**使用示例**：
```typescript
// api/modules/auth.ts
import { post, get } from '../request'

export function login(data: ILoginRequest) {
  return post<ILoginResponse>('/api/v1/auth/login', data)
  //      ↑ 泛型 = 返回的 data 类型（已自动解包，无需 .data.data）
}

export function getUserProfile() {
  return get<IUserProfile>('/api/v1/users/profile')
}
```

### 5.2 SSE 流式接口

以下接口使用 Server-Sent Events 流式返回，**不走 Axios**，必须使用 `useSSE()` composable：

| 接口 | 模块 | 事件类型 |
|------|------|---------|
| `POST /agent/chat` | AI Agent | `thought` → `content` → `done` |
| `POST /summaries/generate` | 课文总结 | `content` → `knowledge_points` → `done` |
| `POST /exercises/generate` | 习题生成 | `progress` → `exercise` → `done` |

```typescript
import { useSSE } from '@/composables/useSSE'

const { message, isStreaming, connect, disconnect } = useSSE()

await connect({
  url: '/api/v1/agent/chat',
  body: { session_id: null, message: '帮我总结《桃花源记》' },
  onThought: (data) => { /* 渲染思考链 */ },
  onContent: (chunk) => { /* 追加文字 */ },
  onDone: (data) => { /* 保存会话 */ },
  onError: (err) => { /* 显示错误 */ },
})
```

---

## 六、类型系统

`src/types/index.ts` 定义了与后端 Pydantic Schema 完全对齐的类型，是前后端协作的契约。

### 类型分类

| 命名空间 | 覆盖模块 | 核心类型 |
|----------|---------|---------|
| 认证/用户 | PBI_01 | `IUserProfile`, `ILoginRequest`, `ILoginResponse`, `IDashboardData` |
| AI Agent | PBI_04/12 | `IChatSession`, `IChatMessage`, `IThoughtStep`, `IToolCall` |
| 课文总结 | PBI_06 | `ISummaryRecord`, `SummaryMode`, `SummarySourceType` |
| 文件管理 | PBI_05 | `IUploadedFile`, `FileType`, `ParseStatus` |
| 习题 | PBI_08/09/10 | `IExercise`, `IGradeResult`, `Difficulty`, `QuestionType` |
| 知识图谱 | PBI_11 | `IKnowledgeGraph`, `IGraphNode`, `IGraphEdge` |

### 新增类型时

1. 对齐后端 Pydantic Schema（字段名、类型、枚举值完全一致）
2. 放在 `types/index.ts` 对应区块（有注释分隔）
3. 复用已有基础类型（`Difficulty`、`QuestionType` 等枚举）

---

## 七、下一步开发指引

### Sprint 1 第一阶段（当前优先）

```
优先级：P1

PBI_01 认证模块
  ├── 前端：激活 LoginView/RegisterView/ForgotPasswordView（UI 已完成）
  ├── 后端：实现 auth.py / users.py 路由
  └── 联调：登录 → 获取 Token → 跳转仪表盘

PBI_04 AI Agent
  ├── 前端：完善 AgentView 对话界面 + useSSE 对接
  ├── 前端（PBI_12）：思考链面板组件
  └── 后端：实现 agent.py SSE 接口 + 工具注册

PBI_06 课文总结
  ├── 前端：完善 SummaryView 输入/结果展示
  ├── 后端：实现 summary.py SSE 接口
  └── 集成：Agent 通过 text_summary 工具调用总结
```

### Sprint 2 第二阶段

```
PBI_05 文件管理 → 前端 30% / 后端 70%
PBI_08/09/10 习题 → 先出题流程 → 再做/析双模式 → 后批改
PBI_11 知识图谱 → ECharts 渲染、拖拽交互、导出
```

---

## 八、常用命令

```bash
npm run dev          # 启动开发服务器（热更新，默认 :5173）
npm run build        # 生产构建（类型检查 + Vite 打包）
npm run preview      # 预览生产构建
npm run lint         # ESLint 检查并自动修复
npm run format       # Prettier 格式化所有源码
npm run type-check   # 仅类型检查（不构建）
```

---

## 附录 A：Element Plus 图标使用

所有 Element Plus 图标已全局注册，在 `.vue` 中直接使用：

```html
<el-icon :size="20">
  <ChatDotRound />
</el-icon>
```

无需手动 import，可直接使用任何 [Element Plus Icons](https://element-plus.org/en-US/component/icon.html) 图标。

---

## 附录 B：文件对应关系速查

| 要实现的功能 | 修改这些文件 |
|-------------|-------------|
| 新增页面 | `views/<module>/XxxView.vue` + `router/index.ts` |
| 新增 API | `api/modules/<module>.ts` + `types/index.ts` |
| 新增全局状态 | `stores/<name>.ts` |
| 新增布局组件 | `components/layout/` |
| 新增可复用组件 | `components/common/` 或 `components/business/` |
| 新增组合逻辑 | `composables/useXxx.ts` |
| 修改主题色 | `assets/styles/variables.scss` |
| 修改 Element Plus 样式 | `assets/styles/element-plus-override.scss` |
| 修改 Axios 行为 | `api/request.ts`（拦截器） |
| 修改路由守卫 | `router/index.ts`（beforeEach） |

---

> **文档维护约定**：本报告随前端基础层交付产生，后续每次 PBI 交付应更新 SPRINT.md（待创建）记录进展。  
> **后端文档参考**：`智翼平台开发规范与接口文档.md`（桌面）为前后端协作唯一标准。  
> **项目路径**：前端 `D:\VScode\zy-fe\frontend\` | 后端 `D:\VScode\zy\backend\`
