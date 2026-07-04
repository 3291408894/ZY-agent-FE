<script setup lang="ts">
/**
 * AppLayout — 智翼平台标准布局
 * 固定 Header(顶部) + 固定 Sidebar(左侧) + 内容区 + Footer
 */
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="app-layout" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
    <AppHeader
      :is-sidebar-collapsed="sidebarCollapsed"
      @toggle-sidebar="toggleSidebar"
    />
    <AppSidebar :collapsed="sidebarCollapsed" />
    <main class="app-layout__main">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-bg);

  &__main {
    // Offset for fixed header + fixed sidebar
    padding-top: calc(var(--header-height) + var(--page-padding));
    padding-left: calc(var(--sidebar-width) + var(--page-padding));
    padding-right: var(--page-padding);
    padding-bottom: var(--spacing-xxl);
    min-height: 100vh;
    transition: padding-left var(--transition-base);
  }
}

// Sidebar collapsed state → content expands
.sidebar--collapsed .app-layout__main {
  padding-left: calc(var(--sidebar-collapsed-width) + var(--page-padding));
}
</style>
