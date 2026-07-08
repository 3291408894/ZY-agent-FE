<script setup lang="ts">
/**
 * 智能教案生成 — 结果展示组件 (PBI_LP)
 * 显示流式生成的教案内容，支持复制和下载
 */
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useLessonPlanStore } from '@/stores/lessonPlan'
import { renderMarkdown } from '@/utils/markdown'

const emit = defineEmits<{
  back: []
}>()

const store = useLessonPlanStore()

const renderedHtml = computed(() => {
  return renderMarkdown(store.currentContent)
})

const isComplete = computed(() => {
  return !!store.currentLessonPlanId && !store.isStreaming
})

/** 复制教案内容 */
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(store.currentContent)
    ElMessage.success('教案内容已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择文本复制')
  }
}

/** 下载教案为 Markdown 文件 */
function handleDownload() {
  const blob = new Blob([store.currentContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const filename = store.currentTitle
    ? `${store.currentTitle}.md`
    : `教案_${new Date().toLocaleDateString()}.md`
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('教案已下载')
}
</script>

<template>
  <div class="lp-result">
    <!-- 工具栏 -->
    <div class="lp-result__toolbar">
      <div class="lp-result__status">
        <template v-if="store.isStreaming">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>AI 正在生成教案...</span>
        </template>
        <template v-else-if="store.streamError">
          <el-tag type="danger" size="large">{{ store.streamError }}</el-tag>
        </template>
        <template v-else>
          <el-tag type="success" size="large">✅ 教案生成完成</el-tag>
        </template>
      </div>

      <div class="lp-result__actions">
        <el-button
          v-if="isComplete"
          type="primary"
          plain
          :icon="'CopyDocument'"
          @click="handleCopy"
        >
          复制内容
        </el-button>
        <el-button
          v-if="isComplete"
          type="success"
          plain
          :icon="'Download'"
          @click="handleDownload"
        >
          下载 Markdown
        </el-button>
        <el-button
          v-if="!store.isStreaming"
          @click="emit('back')"
        >
          生成新教案
        </el-button>
      </div>
    </div>

    <!-- 教案内容 -->
    <div class="lp-result__content">
      <!-- 流式生成中：实时渲染 -->
      <div
        v-if="store.currentContent"
        class="lp-result__markdown markdown-body"
        v-html="renderedHtml"
      />

      <!-- 等待中 -->
      <div
        v-else-if="store.isStreaming"
        class="lp-result__waiting"
      >
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>正在连接 AI 服务，请稍候...</p>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无教案内容"
      />
    </div>

    <!-- 滚动到底部按钮 -->
    <div
      v-if="store.isStreaming"
      class="lp-result__scroll-hint"
    >
      <span>AI 正在持续输出中，内容将自动滚动</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lp-result {
  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    padding: var(--spacing-base) var(--spacing-lg);
    background: var(--color-bg);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border-bottom: none;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  &__content {
    min-height: 400px;
    padding: var(--spacing-xl);
    background: var(--color-bg);
    border: 1px solid var(--color-border-light);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  &__markdown {
    max-width: 100%;
    overflow-x: auto;

    // Markdown 基础样式
    :deep(h1) {
      font-size: 22px;
      font-weight: 700;
      margin: var(--spacing-lg) 0 var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--color-border-light);
      color: var(--color-text);
    }

    :deep(h2) {
      font-size: 18px;
      font-weight: 600;
      margin: var(--spacing-lg) 0 var(--spacing-md);
      padding-left: var(--spacing-sm);
      border-left: 4px solid var(--color-primary);
      color: var(--color-text);
    }

    :deep(h3) {
      font-size: 16px;
      font-weight: 600;
      margin: var(--spacing-md) 0 var(--spacing-sm);
      color: var(--color-text);
    }

    :deep(p) {
      margin: var(--spacing-sm) 0;
      line-height: 1.8;
      color: var(--color-text);
    }

    :deep(ul), :deep(ol) {
      padding-left: var(--spacing-xl);
      margin: var(--spacing-sm) 0;

      li {
        line-height: 1.8;
        color: var(--color-text);
      }
    }

    :deep(code) {
      background: var(--color-fill-light);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-size: 0.9em;
    }

    :deep(pre) {
      background: var(--color-fill-light);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin: var(--spacing-md) 0;

      code {
        background: transparent;
        padding: 0;
      }
    }

    :deep(blockquote) {
      border-left: 3px solid var(--color-primary-light);
      padding: var(--spacing-sm) var(--spacing-md);
      margin: var(--spacing-md) 0;
      background: var(--color-primary-lighter);
      color: var(--color-text-secondary);
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: var(--spacing-md) 0;

      th, td {
        border: 1px solid var(--color-border-light);
        padding: var(--spacing-sm) var(--spacing-md);
        text-align: left;
      }

      th {
        background: var(--color-fill-light);
        font-weight: 600;
      }
    }
  }

  &__waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: var(--spacing-md);
    color: var(--color-text-placeholder);

    p {
      font-size: var(--font-size-base);
    }
  }

  &__scroll-hint {
    text-align: center;
    padding: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }
}
</style>
