// ================================================================
// 智翼 (ZhiYi) AI 学习助手 — 前端入口
// Vue 3.4+ + TypeScript + Pinia + Vue Router 4 + Element Plus
// ================================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 样式导入顺序：Element Plus → 主题变量 → Element Plus 覆盖 → 全局样式
import 'element-plus/dist/index.css'
import '@/assets/styles/variables.scss'
import '@/assets/styles/element-plus-override.scss'
import '@/assets/styles/global.scss'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'

// ── 创建应用 ──
const app = createApp(App)

// ── 安装插件 ──
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// ── 注册所有 Element Plus 图标 ──
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ── 初始化主题（从 localStorage 恢复） ──
const themeStore = useThemeStore()
themeStore.init()

// ── 挂载 ──
app.mount('#app')
