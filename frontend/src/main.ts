/** 智翼平台 — Vue 应用入口 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './assets/styles/variables.scss'
import './assets/styles/element-plus-override.scss'
import './assets/styles/global.scss'

const app = createApp(App)

// ── 全局注册 Element Plus 图标 ──
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
