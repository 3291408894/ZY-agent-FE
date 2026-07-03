<script setup lang="ts">
/**
 * 课文总结 — 结果展示组件
 * 支持精简/详细模式切换、知识点展示、复制、重新生成
 */
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CopyDocument, Download, Plus, Loading, Collection } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { SUMMARY_MODE_LABELS } from '@/api/modules/summary'
import { renderMarkdown } from '@/utils/markdown'

const emit = defineEmits<{
  (e: 'new-summary'): void
}>()

const store = useSummaryStore()

const hasContent = computed(() => store.currentContent.length > 0)
const hasKnowledgePoints = computed(() => store.currentKnowledgePoints.length > 0)
const hasError = computed(() => !!store.streamError)

/** 知识点按类别分组 */
const groupedKnowledgePoints = computed(() => {
  const groups: Record<string, string[]> = {}
  for (const kp of store.currentKnowledgePoints) {
    const cat = kp.category || '其他'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(kp.name)
  }
  return Object.entries(groups)
})

/** 复制总结文本 */
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(store.currentContent)
    ElMessage.success('已复制到剪贴板')
  } catch {
    // Fallback: 浏览器不支持 Clipboard API 时使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = store.currentContent
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      // @ts-expect-error execCommand is deprecated but still the only fallback
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

/** 下载为 Markdown 文件 */
function handleDownload() {
  const blob = new Blob([store.currentContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `课文总结_${new Date().toLocaleDateString('zh-CN')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}

</script>

<template>
  <div class="summary-result">
    <!-- ── 结果头部操作栏 ── -->
    <div class="result-header">
      <div class="result-header__left">
        <h3 class="result-header__title">
          <el-icon><Document /></el-icon>
          总结结果
          <el-tag
            v-if="store.currentSummaryId"
            size="small"
            type="success"
            effect="plain"
          >
            {{ SUMMARY_MODE_LABELS[store.currentDetail?.mode || 'detailed'] }}
          </el-tag>
        </h3>
      </div>
      <div class="result-header__actions">
        <el-button
          v-if="hasContent"
          text
          size="small"
          @click="handleCopy"
        >
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button
          v-if="hasContent"
          text
          size="small"
          @click="handleDownload"
        >
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button
          text
          size="small"
          type="primary"
          @click="emit('new-summary')"
        >
          <el-icon><Plus /></el-icon>
          新建总结
        </el-button>
      </div>
    </div>

    <!-- ── 流式生成中 ── -->
    <div v-if="store.isStreaming" class="streaming-indicator">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>AI 正在生成总结…</span>
      <span class="streaming-indicator__cursor">▊</span>
    </div>

    <!-- ── 总结正文 ── -->
    <div
      v-if="hasContent"
      class="result-content"
      v-html="renderMarkdown(store.currentContent)"
    />

    <!-- ── 空结果 ── -->
    <el-empty
      v-if="!hasContent && !store.isStreaming && !hasError"
      description="暂无总结内容"
      :image-size="120"
    />

    <!-- ── 错误提示 ── -->
    <el-alert
      v-if="hasError"
      :title="store.streamError || '生成失败'"
      type="error"
      show-icon
      :closable="false"
      style="margin-top: var(--spacing-md)"
    />

    <!-- ── 知识点区域 ── -->
    <div v-if="hasKnowledgePoints" class="knowledge-section">
      <el-divider />
      <h4 class="knowledge-section__title">
        <el-icon><Collection /></el-icon>
        提取的知识点
      </h4>
      <div
        v-for="[category, points] in groupedKnowledgePoints"
        :key="category"
        class="knowledge-group"
      >
        <span class="knowledge-group__category">{{ category }}</span>
        <div class="knowledge-group__tags">
          <el-tag
            v-for="point in points"
            :key="point"
            size="default"
            effect="light"
          >
            {{ point }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.summary-result {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;
    font-size: 18px;
    color: var(--color-text);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-xs);
  }
}

// ── 流式指示器 ──
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-primary);
  font-size: 14px;

  &__cursor {
    animation: blink 1s infinite;
    color: var(--color-primary);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

// ── 总结正文富文本 ──
.result-content {
  font-size: var(--font-size-base, 15px);
  line-height: 1.9;
  color: var(--color-text);

  :deep(.md-h1) {
    font-size: 22px;
    margin: var(--spacing-lg) 0 var(--spacing-md);
    color: var(--color-text);
    border-bottom: 2px solid var(--color-primary-light);
    padding-bottom: var(--spacing-sm);
  }

  :deep(.md-h2) {
    font-size: 19px;
    margin: var(--spacing-lg) 0 var(--spacing-md);
    color: var(--color-primary);
  }

  :deep(.md-h3) {
    font-size: 16px;
    margin: var(--spacing-md) 0 var(--spacing-sm);
    color: var(--color-text);
  }

  :deep(strong) {
    color: var(--color-primary);
  }

  :deep(ul) {
    padding-left: var(--spacing-xl);
    margin: var(--spacing-sm) 0;
  }

  :deep(li) {
    margin-bottom: var(--spacing-xs);
  }
}

// ── 知识点 ──
.knowledge-section {
  margin-top: var(--spacing-lg);

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0 0 var(--spacing-md) 0;
    font-size: 16px;
    color: var(--color-text);
  }
}

.knowledge-group {
  margin-bottom: var(--spacing-md);

  &__category {
    display: inline-block;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
    background: var(--color-bg);
    padding: 2px var(--spacing-sm);
    border-radius: var(--radius-sm);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
}
</style>
