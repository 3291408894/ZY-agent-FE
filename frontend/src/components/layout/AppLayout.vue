<script setup lang="ts">
// ================================================================
// AppLayout — 智翼平台主布局容器
// 对应 PBI_02：首页导航 + 功能布局
// 结构：Header | Sidebar + MainContent | Footer
// ================================================================

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'

const route = useRoute()

// ── 侧边栏折叠状态 ──
const isSidebarCollapsed = ref(false)

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// ── 是否为全屏页面（登录/注册页不显示导航） ──
const isFullscreenPage = computed(() => {
  const fullscreenPaths = ['/login', '/register', '/forgot-password']
  return fullscreenPaths.includes(route.path)
})

// ── 是否显示侧边栏 ──
const showSidebar = computed(() => {
  const noSidebarPaths = ['/login', '/register', '/forgot-password']
  return !noSidebarPaths.includes(route.path)
})
</script>

<template>
  <!-- ── 全屏页面（登录/注册）：无导航布局 ── -->
  <div v-if="isFullscreenPage" class="app-layout--fullscreen">
    <router-view />
  </div>

  <!-- ── 正常布局：Header + Sidebar + Content + Footer ── -->
  <div v-else class="app-layout">
    <AppHeader
      :is-sidebar-collapsed="isSidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="app-layout__body">
      <AppSidebar
        v-if="showSidebar"
        :collapsed="isSidebarCollapsed"
      />

      <main
        class="app-layout__main"
        :class="{
          'main--full': !showSidebar,
          'main--sidebar-collapsed': isSidebarCollapsed,
        }"
      >
        <div class="app-layout__content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
        <AppFooter />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 全屏布局（登录/注册等）
// ================================================================
.app-layout--fullscreen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
}

// ================================================================
// 标准布局
// ================================================================
.app-layout {
  min-height: 100vh;
  background: var(--color-bg);

  &__body {
    display: flex;
    padding-top: var(--header-height);
    min-height: 100vh;
  }

  &__main {
    flex: 1;
    margin-left: var(--sidebar-width);
    display: flex;
    flex-direction: column;
    transition: margin-left var(--transition-base);
    min-height: calc(100vh - var(--header-height));
    min-width: 0; // 防止 flex 子元素溢出

    &.main--full {
      margin-left: 0;
    }

    &.main--sidebar-collapsed {
      margin-left: var(--sidebar-collapsed-width);
    }
  }

  &__content {
    flex: 1;
    padding: var(--page-padding);
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
  }
}

// ================================================================
// 响应式适配
// ================================================================
@media (max-width: 768px) {
  .app-layout__main {
    margin-left: 0 !important;
  }

  .app-layout__content {
    padding: var(--spacing-base);
  }
}
</style>
