# 智翼 (ZhiYi) AI 学习助手 — 前端项目

> 面向 K12 学生的 AI 学习辅助平台前端  
> Vue 3.4+ / TypeScript 5.x / Vite 5.x / Element Plus / Pinia / Vue Router 4

## 快速启动

```bash
cd D:\VScode\zy-fe\frontend
npm install
npm run dev        # → http://localhost:5173
npm run build      # 生产构建
```

## 目录结构

```
src/
├── api/                    # Axios 封装 + 各业务模块 API 函数
│   ├── request.ts          # 拦截器、Token 注入、错误处理
│   ├── types.ts            # API 通用类型
│   └── modules/            # auth | agent | summary | exercise | file | knowledge
├── assets/styles/          # SCSS 样式体系
│   ├── variables.scss      # CSS 变量（护眼配色、字体、间距、阴影、Z-index）
│   ├── mixins.scss         # 响应式、文本截断、卡片、滚动条
│   ├── element-plus-override.scss  # Element Plus 主题映射
│   └── global.scss         # 全局 Reset + 通用工具类
├── components/
│   ├── layout/             # AppLayout | AppHeader | AppSidebar | AppFooter
│   ├── common/             # 通用组件（待扩展）
│   └── business/           # 业务组件（待扩展）
├── composables/            # useAuth | useTheme | useFontSize | useSSE
├── router/index.ts         # 路由配置 + 导航守卫
├── stores/                 # Pinia: theme | user | agent
├── types/index.ts          # 全局 TS 类型（与后端 Pydantic Schema 对齐）
├── views/                  # 页面: auth | dashboard | agent | summary | exercise | files | knowledge
└── main.ts                 # 入口
```

## PBI 对应关系

| PBI | 功能 | 前端状态 | 核心文件 |
|-----|------|---------|---------|
| **PBI_02** | 导航布局 | ✅ 已搭建 | `components/layout/`, `router/index.ts` |
| **PBI_03** | UI 主题 | ✅ 已搭建 | `styles/variables.scss`, `stores/theme.ts`, `composables/useFontSize.ts` |
| PBI_01 | 认证 | 骨架就绪 | `views/auth/`, `api/modules/auth.ts`, `stores/user.ts` |
| PBI_04/12 | AI Agent | 骨架就绪 | `views/agent/`, `composables/useSSE.ts` |
| PBI_06 | 课文总结 | 骨架就绪 | `views/summary/` |
| PBI_05 | 文件管理 | 骨架就绪 | `views/files/` |
| PBI_08/09/10 | 习题 | 骨架就绪 | `views/exercise/` |
| PBI_11 | 知识图谱 | 骨架就绪 | `views/knowledge/` |

## 关键设计决策

### 护眼配色（PBI_03）
- 主色：`#5B9BD5`（柔和蓝）
- 背景：`#F5F3EE`（米白护眼）
- 所有颜色通过 CSS 自定义属性控制 → `assets/styles/variables.scss`
- 支持暗色模式切换（`data-theme="dark"`）
- 字体三档可调：小(13px) / 中(15px, 默认) / 大(17px)

### 布局（PBI_02）
- 全屏页面（登录/注册）无导航
- 标准页面：Header(固定) + Sidebar(可折叠) + MainContent + Footer
- 移动端响应式（断点：768px）
- 侧边栏折叠通过 `var(--sidebar-width)` / `var(--sidebar-collapsed-width)` 控制

### 状态管理
- 主题/字体 → `stores/theme.ts`（持久化到 localStorage）
- 用户/认证 → `stores/user.ts`
- 页面内部状态 → 组件级 `ref`/`reactive`

### API 请求
- Axios 实例统一拦截：Token 注入 + 响应解包 + 401 跳转登录
- SSE 流式接口（Agent/总结/出题）使用 `composables/useSSE.ts`，不走 Axios

## 开发规范速查

- 组件文件：PascalCase（`KnowledgeGraph.vue`）
- TS 文件：camelCase（`useAuth.ts`）
- `<script setup lang="ts">` 为标准写法
- CSS class：kebab-case
- 接口以 `I` 前缀（`IUser`）
- 路由 path：kebab-case（`/knowledge-graph`）

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8000` |
| `VITE_USE_MOCK` | 是否启用 Mock | `false` |
| `VITE_APP_TITLE` | 应用标题 | 智翼 AI 学习助手 |
