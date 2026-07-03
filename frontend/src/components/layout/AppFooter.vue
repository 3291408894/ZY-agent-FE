<script setup lang="ts">
// ================================================================
// AppFooter — 智翼平台底部栏
// ================================================================
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__copyright">
        © {{ new Date().getFullYear() }} 智翼 ZhiYi AI 学习助手 · 版权所有
      </span>
      <span class="app-footer__links">
        <a href="#" class="app-footer__link">帮助中心</a>
        <span class="app-footer__divider">|</span>
        <a href="#" class="app-footer__link">隐私政策</a>
        <span class="app-footer__divider">|</span>
        <a href="#" class="app-footer__link">用户协议</a>
      </span>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  height: var(--footer-height);
  display: flex;
  align-items: center;
  padding: 0 var(--page-padding);
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-light);

  &__inner {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }

  &__links {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__link {
    color: var(--color-text-placeholder);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-primary);
    }
  }

  &__divider {
    color: var(--color-border);
  }
}

// 移动端简化
@media (max-width: 640px) {
  .app-footer {
    height: auto;
    padding: var(--spacing-sm) var(--spacing-base);

    &__inner {
      flex-direction: column;
      gap: var(--spacing-xs);
      text-align: center;
    }
  }
}
</style>
