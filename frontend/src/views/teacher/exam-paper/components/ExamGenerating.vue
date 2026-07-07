<script setup lang="ts">
/** 试卷生成中 — 流式进度展示 */

import { computed } from 'vue'
import { useExamPaperStore } from '@/stores/examPaper'

const store = useExamPaperStore()

const stageLabel = computed(() => {
  switch (store.thinkingStage) {
    case 'analyzing': return '正在分析试卷配置...'
    case 'objectives': return '正在设计教学目标...'
    case 'process': return '正在出题...'
    default: return 'AI 生成中...'
  }
})

const markdownPreview = computed(() => {
  const text = store.generatedContent
  if (!text) return ''
  // 简单 markdown 转义（防止 vue 模板插值问题）
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
})

function handleCancel() {
  store.resetStage()
}
</script>

<template>
  <div class="exam-generating">
    <div class="exam-generating__status">
      <el-icon class="is-loading" :size="40">
        <component :is="'Loading'" />
      </el-icon>
      <div class="exam-generating__label">{{ stageLabel }}</div>
      <el-progress
        :percentage="store.generatedContent ? 70 : 30"
        :indeterminate="true"
        :stroke-width="4"
        style="width: 300px; margin-top: 16px"
      />
    </div>

    <!-- 流式内容预览 -->
    <div v-if="store.generatedContent" class="exam-generating__preview">
      <pre>{{ markdownPreview.slice(-2000) }}</pre>
    </div>

    <div class="exam-generating__actions">
      <el-button @click="handleCancel">取消生成</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exam-generating {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;

  &__status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 0;
  }

  &__label {
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-secondary);
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__preview {
    margin-top: 24px;
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border-light);

    pre {
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 13px;
      line-height: 1.6;
      color: var(--color-text-primary);
      font-family: 'Courier New', monospace;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
