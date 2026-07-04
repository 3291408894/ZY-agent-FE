// ================================================================
// 智翼 (ZhiYi) — Vite 构建配置
// ================================================================

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 路径别名（@ → src/）
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // SCSS 配置（不在 additionalData 中注入，避免模块循环引用）
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },

  // 开发服务器
  server: {
    port: 5173,
    open: true,
    // 代理配置（联调时使用）
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // 生产构建
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 手动分包（函数形式兼容 Rolldown）
        manualChunks(id: string) {
          if (id.includes('node_modules/element-plus')) return 'element-plus'
          if (id.includes('node_modules/echarts')) return 'echarts'
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) return 'vue-vendor'
          if (id.includes('node_modules/axios')) return 'network'
        },
      },
    },
  },
})
