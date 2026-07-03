/// <reference types="vite/client" />

// ================================================================
// 智翼 (ZhiYi) — 环境变量类型声明
// ================================================================

interface ImportMetaEnv {
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
  /** 是否启用 Mock */
  readonly VITE_USE_MOCK: 'true' | 'false'
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ── .vue 文件模块声明 ──
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// ── SCSS 模块声明 ──
declare module '*.scss' {
  const content: Record<string, string>
  export default content
}
