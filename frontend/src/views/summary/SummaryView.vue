<script setup lang="ts">
/**
 * 课文总结 — 主页面容器 (PBI_06)
 * 包含两个 Tab：新建总结 / 历史记录
 */
import { ref } from 'vue'
import SummaryInput from './SummaryInput.vue'
import SummaryHistory from './SummaryHistory.vue'

type TabName = 'create' | 'history'
const activeTab = ref<TabName>('create')
</script>

<template>
  <div class="summary-view">
    <!-- 页面头部 -->
    <div class="page-hero">
      <div class="page-hero__content">
        <h1 class="page-hero__title">
          <span class="page-hero__icon">📝</span>
          课文总结
        </h1>
        <p class="page-hero__subtitle">
          智能分析课文内容，AI 自动生成结构化总结，精准提取核心知识点
        </p>
      </div>
      <div class="page-hero__badges">
        <span class="hero-badge"><span>✨</span> AI 驱动</span>
        <span class="hero-badge"><span>🧠</span> 知识点提取</span>
        <span class="hero-badge"><span>📊</span> 结构化输出</span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="summary-view__tabs">
      <el-tab-pane name="create">
        <template #label>
          <span class="tab-label">
            <span class="tab-label__icon">✍️</span>
            新建总结
          </span>
        </template>
        <SummaryInput />
      </el-tab-pane>

      <el-tab-pane name="history">
        <template #label>
          <span class="tab-label">
            <span class="tab-label__icon">📚</span>
            历史记录
          </span>
        </template>
        <SummaryHistory />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.summary-view {
  padding: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

// ── 页面头部 ──
.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-xl) var(--spacing-xxl);
  background: linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-bg-card) 100%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);

  &__content { flex: 1; }

  &__icon { font-size: 28px; }

  &__title {
    font-size: 26px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--spacing-sm) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__subtitle {
    font-size: var(--font-size-base, 15px);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.6;
  }

  &__badges {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }
}

.hero-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary-dark);
  background: rgba(91, 155, 213, 0.12);
  padding: 5px 12px;
  border-radius: var(--radius-round);
  white-space: nowrap;
}

// ── Tab ──
.summary-view__tabs {
  :deep(.el-tabs__header) {
    margin-bottom: var(--spacing-lg);
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__item) {
    font-size: var(--font-size-base, 15px);
    font-weight: 500;
    padding: 0 var(--spacing-lg);
    height: 44px;
    line-height: 44px;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 2px;
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;

  &__icon { font-size: 16px; }
}

// ── 响应式 ──
@media (max-width: 768px) {
  .summary-view { padding: var(--spacing-md); }

  .page-hero {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);

    &__badges { flex-wrap: wrap; }
    &__title { font-size: 22px; }
  }
}
</style>
