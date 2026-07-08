<script setup lang="ts">
/**
 * 智能教案生成 — 主页面容器 (PBI_LP)
 * 包含两个 Tab：新建教案 / 历史记录
 */
import { ref } from 'vue'
import LessonPlanInput from './LessonPlanInput.vue'
import LessonPlanHistory from './LessonPlanHistory.vue'

type TabName = 'create' | 'history'
const activeTab = ref<TabName>('create')

/** 教案生成完成后刷新历史列表 */
function onPlanGenerated() {
  // 保持在当前视图，由子组件展示结果
}
</script>

<template>
  <div class="lesson-plan-view">
    <div class="lesson-plan-view__header">
      <h1 class="lesson-plan-view__title">📋 智能教案生成</h1>
      <p class="lesson-plan-view__subtitle">
        AI 驱动的智能教案设计工具 — 输入教学目标，一键生成结构化完整教案
      </p>
    </div>

    <el-tabs
      v-model="activeTab"
      class="lesson-plan-view__tabs"
    >
      <el-tab-pane label="新建教案" name="create">
        <LessonPlanInput @generated="onPlanGenerated" />
      </el-tab-pane>

      <el-tab-pane label="历史记录" name="history">
        <LessonPlanHistory />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.lesson-plan-view {
  padding: var(--spacing-xl);
  max-width: 1000px;
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
