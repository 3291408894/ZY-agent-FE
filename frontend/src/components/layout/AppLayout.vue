<script setup lang="ts">
/** 标准布局：Header + Sidebar + 内容区 + Footer */
</script>

<template>
  <div class="app-layout">
    <header class="app-layout__header">
      <h1>📚 智翼 AI 学习助手</h1>
      <span style="font-size:13px;color:var(--color-text-secondary)">课文总结 · Sprint 1</span>
    </header>
    <div class="app-layout__body">
      <aside class="app-layout__sidebar">
        <nav>
          <router-link to="/dashboard">📊 仪表盘</router-link>
          <router-link to="/agent">🤖 AI 助手</router-link>
          <router-link to="/summary">📝 课文总结</router-link>
        </nav>
      </aside>
      <main class="app-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: 0 var(--spacing-xl);
    height: 56px;
    background: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border);
    h1 { font-size: 18px; margin: 0; }
  }

  &__body {
    display: flex;
    flex: 1;
  }

  &__sidebar {
    width: 200px;
    background: var(--color-bg-card);
    border-right: 1px solid var(--color-border);
    padding: var(--spacing-md);
    nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    a {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      color: var(--color-text);
      font-size: 14px;
      &.router-link-active {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
