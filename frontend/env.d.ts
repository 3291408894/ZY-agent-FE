/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// Vue Router 路由元信息扩展
export {}

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'default' | 'fullscreen'
    requiresAuth?: boolean
    guest?: boolean
    requiredRole?: 'teacher'
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
