<script setup lang="ts">
/**
 * 课文总结 — 结果展示组件
 * 支持流式生成动画、Markdown 渲染、知识点卡片、复制/下载/新建
 */
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CopyDocument, Download, Plus, Collection, Timer } from '@element-plus/icons-vue'
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

// ── 统计 ──
const wordCount = computed(() => store.currentContent.replace(/\s/g, '').length)
const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))

// ── 知识点按类别分组 ──
const categoryIcons: Record<string, string> = {
  '主旨': '🎯', '主题': '🎯', '中心思想': '🎯',
  '人物': '👤', '人物形象': '👤',
  '情节': '📖', '结构': '📖',
  '写作手法': '✍️', '修辞': '✍️', '表达技巧': '✍️',
  '字词': '📝', '词汇': '📝', '语言': '📝',
  '考点': '⭐', '重点': '⭐',
  '背景': '🏛️', '时代背景': '🏛️', '作者': '🏛️',
  '情感': '💭', '思想': '💭', '感悟': '💭',
}
function getCategoryIcon(cat: string): string {
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (cat.includes(key)) return icon
  }
  return '📌'
}

const groupedKnowledgePoints = computed(() => {
  const groups: Record<string, string[]> = {}
  for (const kp of store.currentKnowledgePoints) {
    const cat = kp.category || '其他'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(kp.name)
  }
  return Object.entries(groups)
})

// ── 复制 ──
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(store.currentContent)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = store.currentContent
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

// ── 下载 ──
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
    <!-- 头部 -->
    <div class="result-header">
      <div class="result-header__top">
        <div class="result-header__title-row">
          <span class="result-header__icon">📄</span>
          <h3 class="result-header__title">总结结果</h3>
          <el-tag
            v-if="store.currentSummaryId"
            size="small"
            effect="light"
            round
            :type="store.currentDetail?.mode === 'brief' ? 'info' : 'primary'"
          >
            {{ SUMMARY_MODE_LABELS[store.currentDetail?.mode || 'detailed'] }}
          </el-tag>
        </div>
        <div class="result-header__actions">
          <el-button v-if="hasContent && !store.isStreaming" text size="small" @click="handleCopy">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
          <el-button v-if="hasContent && !store.isStreaming" text size="small" @click="handleDownload">
            <el-icon><Download /></el-icon>
            下载 MD
          </el-button>
          <el-divider direction="vertical" />
          <el-button text size="small" type="primary" @click="emit('new-summary')">
            <el-icon><Plus /></el-icon>
            新建总结
          </el-button>
        </div>
      </div>

      <!-- 统计行 -->
      <div v-if="hasContent && !store.isStreaming" class="result-header__stats">
        <span class="stat-item"><el-icon><Document /></el-icon> {{ wordCount.toLocaleString() }} 字</span>
        <span class="stat-dot">·</span>
        <span class="stat-item"><el-icon><Timer /></el-icon> 约 {{ readingTime }} 分钟阅读</span>
        <span class="stat-dot">·</span>
        <span class="stat-item"><el-icon><Collection /></el-icon> {{ store.currentKnowledgePoints.length }} 个知识点</span>
      </div>
    </div>

    <!-- 流式生成中 -->
    <div v-if="store.isStreaming" class="streaming-box">
      <div class="streaming-box__indicator">
        <span class="streaming-dot"></span>
        <span class="streaming-dot"></span>
        <span class="streaming-dot"></span>
        <span class="streaming-text">AI 正在分析课文并生成总结…</span>
      </div>
      <div
        v-if="hasContent"
        class="streaming-box__preview"
        v-html="renderMarkdown(store.currentContent)"
      />
    </div>

    <!-- 总结正文 -->
    <div
      v-else-if="hasContent"
      class="result-content"
      v-html="renderMarkdown(store.currentContent)"
    />

    <!-- 空结果 -->
    <div v-else-if="!hasError" class="result-empty">
      <span class="result-empty__icon">📝</span>
      <p class="result-empty__title">暂无总结内容</p>
      <p class="result-empty__desc">在上方输入课文内容，AI 将为您生成结构化总结</p>
    </div>

    <!-- 错误 -->
    <el-alert
      v-if="hasError"
      :title="'生成失败'"
      :description="store.streamError || '未知错误'"
      type="error"
      show-icon
      :closable="false"
      style="margin-top: var(--spacing-md)"
    />

    <!-- 知识点 -->
    <div v-if="hasKnowledgePoints && !store.isStreaming" class="knowledge-section">
      <el-divider />
      <div class="knowledge-section__header">
        <span class="knowledge-section__icon">🧠</span>
        <h4 class="knowledge-section__title">提取的知识点</h4>
      </div>
      <div class="knowledge-grid">
        <div
          v-for="[category, points] in groupedKnowledgePoints"
          :key="category"
          class="knowledge-card"
        >
          <div class="knowledge-card__header">
            <span class="knowledge-card__icon">{{ getCategoryIcon(category) }}</span>
            <span class="knowledge-card__category">{{ category }}</span>
            <span class="knowledge-card__count">{{ points.length }}</span>
          </div>
          <div class="knowledge-card__tags">
            <el-tag
              v-for="point in points"
              :key="point"
              size="default"
              effect="light"
              round
            >
              {{ point }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.summary-result {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

// ── 头部 ──
.result-header {
  padding: var(--spacing-xl) var(--spacing-xl) 0;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  &__title-row { display: flex; align-items: center; gap: var(--spacing-sm); }
  &__icon { font-size: 22px; }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
  }

  &__actions { display: flex; align-items: center; gap: var(--spacing-xs); }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
  }
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.stat-dot { color: var(--color-border); font-weight: 700; }

// ── 流式动画 ──
.streaming-box {
  padding: var(--spacing-xl);
  margin: var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-primary-lighter) 0%, #F5F7FA 100%);
  border: 1px solid var(--color-primary-light);
  border-radius: var(--radius-lg);

  &__indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: var(--spacing-md);
  }

  &__preview {
    font-size: var(--font-size-base, 15px);
    line-height: 1.9;
    color: var(--color-text);
    opacity: 0.85;
    max-height: 400px;
    overflow-y: auto;
  }
}

.streaming-text {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
  margin-left: 4px;
}

.streaming-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: dotPulse 1.4s infinite ease-in-out both;

  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
  &:nth-child(3) { animation-delay: 0s; }
}

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

// ── 总结正文 ──
.result-content {
  padding: var(--spacing-xl);
  font-size: var(--font-size-base, 15px);
  line-height: 2;
  color: var(--color-text);

  :deep(.md-h1) {
    font-size: 22px;
    font-weight: 700;
    margin: var(--spacing-xl) 0 var(--spacing-md);
    color: var(--color-text);
    border-left: 4px solid var(--color-primary);
    padding-left: var(--spacing-md);
    line-height: 1.4;
  }

  :deep(.md-h2) {
    font-size: 18px;
    font-weight: 600;
    margin: var(--spacing-lg) 0 var(--spacing-md);
    color: var(--color-primary-dark);
  }

  :deep(.md-h3) {
    font-size: 16px;
    font-weight: 500;
    margin: var(--spacing-md) 0 var(--spacing-sm);
    color: var(--color-text);
  }

  :deep(strong) {
    color: var(--color-primary-darkest);
    font-weight: 600;
  }

  :deep(ul) {
    padding-left: var(--spacing-xl);
    margin: var(--spacing-md) 0;
    list-style: none;

    li {
      position: relative;
      margin-bottom: var(--spacing-sm);
      padding-left: var(--spacing-sm);

      &::before {
        content: '•';
        position: absolute;
        left: -1em;
        color: var(--color-primary);
        font-weight: 700;
      }
    }
  }
}

// ── 空结果 ──
.result-empty {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-xl);

  &__icon { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
  &__title { font-size: 16px; font-weight: 500; color: var(--color-text); margin-bottom: var(--spacing-xs); }
  &__desc { font-size: 14px; color: var(--color-text-secondary); }
}

// ── 知识点 ──
.knowledge-section {
  padding: 0 var(--spacing-xl) var(--spacing-xl);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  &__icon { font-size: 20px; }

  &__title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
  }
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.knowledge-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-sm);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  &__icon { font-size: 18px; }
  &__category { font-size: 14px; font-weight: 600; color: var(--color-text); flex: 1; }

  &__count {
    font-size: 11px;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-round);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
}

@media (max-width: 640px) {
  .knowledge-grid { grid-template-columns: 1fr; }
  .result-header__actions { width: 100%; justify-content: flex-end; }
}
</style>
