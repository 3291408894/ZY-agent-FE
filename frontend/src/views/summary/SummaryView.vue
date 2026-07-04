<script setup lang="ts">
/**
 * 课文总结 — 主页面容器 (PBI_06)
 * 包含两个 Tab：新建总结 / 历史记录
 */
import { ref } from 'vue'
import SummaryInput from './SummaryInput.vue'
import SummaryResult from './SummaryResult.vue'
import SummaryHistory from './SummaryHistory.vue'

type TabName = 'create' | 'history'
const activeTab = ref<TabName>('create')

/** 总结完成后切换到结果展示 */
function onSummaryDone() {
  activeTab.value = 'create'  // 保持在当前视图，由子组件切换展示
}
</script>

<template>
  <div class="summary-view">
    <div class="summary-view__header">
      <h1 class="summary-view__title">📝 课文总结</h1>
      <p class="summary-view__subtitle">
        智能分析课文，生成结构化总结，提取核心知识点
      </p>
    </div>

    <el-tabs
      v-model="activeTab"
      class="summary-view__tabs"
    >
      <el-tab-pane label="新建总结" name="create">
        <SummaryInput />
      </el-tab-pane>

      <el-tab-pane label="历史记录" name="history">
        <SummaryHistory />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.summary-view {
  padding: var(--spacing-xl);
  max-width: 960px;
  margin: 0 auto;

  &__header {
    margin-bottom: var(--spacing-lg);
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 var(--spacing-xs) 0;
  }

  &__subtitle {
    font-size: var(--font-size-base, 15px);
    color: var(--color-text-secondary);
    margin: 0;
  }

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: var(--spacing-lg);
    }

    :deep(.el-tabs__item) {
      font-size: var(--font-size-base, 15px);
    }
  }
}
</style>
