<script setup lang="ts">
/**
 * 课文总结 — 主页面容器 (PBI_06)
 * 左侧边栏：历史记录（始终可见），右侧主体：输入区 + 结果展示
 */
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, Loading } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { SUMMARY_MODE_LABELS } from '@/api/modules/summary'
import { renderMarkdown } from '@/utils/markdown'
import SummaryInput from './SummaryInput.vue'
import type { ISummaryItem, SummaryMode } from '@/types'

const store = useSummaryStore()

// 加载历史列表
onMounted(() => {
  store.fetchHistory()
})

// ── 模式筛选 ──
const filterMode = ref<SummaryMode | ''>('')
function handleFilterChange() {
  store.fetchHistory(1, filterMode.value || undefined)
}

// ── 分页 ──
function handlePageChange(page: number) {
  store.fetchHistory(page)
}

// ── 查看详情（弹窗） ──
const detailVisible = ref(false)
const viewingSummaryId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function handleViewDetail(item: ISummaryItem) {
  viewingSummaryId.value = item.id
  await store.fetchDetail(item.id)
  detailVisible.value = true
}

// ── 删除 ──
async function handleDelete(item: ISummaryItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${getTitle(item)}」吗？删除后无法恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
    deletingId.value = item.id
    await store.removeSummary(item.id)
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  } finally {
    deletingId.value = null
  }
}

/** 从原文中提取标题（取前30字作为摘要标题） */
function getTitle(item: ISummaryItem): string {
  const text = item.source_content || '无标题'
  return text.length > 30 ? text.slice(0, 30).replace(/\n/g, ' ') + '…' : text
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isEmpty = computed(
  () => !store.historyLoading && store.historyList.length === 0
)
</script>

<template>
  <div class="summary-view">
    <!-- ── 页面标题 ── -->
    <div class="summary-view__header">
      <h1 class="summary-view__title">📝 课文总结</h1>
      <p class="summary-view__subtitle">
        智能分析课文，生成结构化总结，提取核心知识点
      </p>
    </div>

    <!-- ── 双栏布局 ── -->
    <div class="summary-view__panels">
      <!-- 左侧边栏：历史记录 -->
      <aside class="summary-view__sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-header__title">历史记录</h3>
        </div>

        <!-- 模式筛选 -->
        <div class="sidebar-filter">
          <el-radio-group
            v-model="filterMode"
            size="small"
            @change="handleFilterChange"
          >
            <el-radio-button value="">
              全部 ({{ store.historyTotal }})
            </el-radio-button>
            <el-radio-button value="brief">
              {{ SUMMARY_MODE_LABELS.brief }}
            </el-radio-button>
            <el-radio-button value="detailed">
              {{ SUMMARY_MODE_LABELS.detailed }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 加载中 -->
        <div v-if="store.historyLoading" class="sidebar-loading">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
          <span>加载中…</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="isEmpty" class="sidebar-empty">
          <div class="sidebar-empty__icon">📄</div>
          <p class="sidebar-empty__text">暂无总结记录</p>
          <p class="sidebar-empty__hint">输入课文内容，开始你的第一篇总结</p>
        </div>

        <!-- 历史列表 -->
        <div v-else class="sidebar-list">
          <div
            v-for="item in store.historyList"
            :key="item.id"
            class="sidebar-item"
            @click="handleViewDetail(item)"
          >
            <div class="sidebar-item__icon">
              <span v-if="item.mode === 'detailed'">📋</span>
              <span v-else>📝</span>
            </div>
            <div class="sidebar-item__info">
              <div class="sidebar-item__title">{{ getTitle(item) }}</div>
              <div class="sidebar-item__meta">
                <el-tag
                  size="small"
                  :type="item.mode === 'detailed' ? 'primary' : 'info'"
                  effect="light"
                >
                  {{ SUMMARY_MODE_LABELS[item.mode] }}
                </el-tag>
                <span class="sidebar-item__date">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>
            <el-button
              class="sidebar-item__delete"
              size="small"
              text
              circle
              :loading="deletingId === item.id"
              @click.stop="handleDelete(item)"
            >
              <el-icon v-if="deletingId !== item.id" :size="14"><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="store.historyTotal > store.historyPageSize" class="sidebar-pagination">
          <el-pagination
            v-model:current-page="store.historyPage"
            :page-size="store.historyPageSize"
            :total="store.historyTotal"
            :pager-count="3"
            layout="prev, pager, next"
            small
            @current-change="handlePageChange"
          />
        </div>
      </aside>

      <!-- 右侧主体：输入区 + 结果展示 -->
      <main class="summary-view__main">
        <SummaryInput />
      </main>
    </div>

    <!-- ── 详情弹窗 ── -->
    <el-dialog
      v-model="detailVisible"
      title="总结详情"
      width="85%"
      top="5vh"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="store.detailLoading" style="text-align: center; padding: 40px">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中…</p>
      </div>
      <div v-else-if="store.currentDetail">
        <p class="detail-source-label">📄 原文内容：</p>
        <div class="detail-source">
          {{ store.currentDetail.source_content }}
        </div>
        <el-divider />
        <div
          class="detail-summary"
          v-html="renderMarkdown(store.currentDetail.summary_text)"
        />
        <div
          v-if="store.currentDetail.knowledge_points.length > 0"
          class="detail-kp"
        >
          <el-divider />
          <p class="detail-kp__title">🎯 知识点：</p>
          <div class="detail-kp__tags">
            <el-tag
              v-for="kp in store.currentDetail.knowledge_points"
              :key="kp.name"
              effect="light"
            >
              {{ kp.category ? `[${kp.category}] ` : '' }}{{ kp.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.summary-view {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);
  min-height: 550px;
  display: flex;
  flex-direction: column;

  &__header {
    margin-bottom: var(--spacing-lg);
    flex-shrink: 0;
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

  &__panels {
    flex: 1;
    display: flex;
    gap: 1px;
    background: var(--color-border-light);
    border-radius: var(--radius-lg);
    overflow: hidden;
    min-height: 0;
  }

  // ── 左侧边栏 ──
  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--color-bg-card);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
      display: none;
    }
  }

  // ── 右侧主体 ──
  &__main {
    flex: 1;
    background: var(--color-bg-card);
    overflow-y: auto;
    padding: var(--spacing-xl);
    min-width: 0;
  }
}

// ── 侧边栏头部 ──
.sidebar-header {
  padding: var(--spacing-base) var(--spacing-base) var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-lighter);
  flex-shrink: 0;

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
  }
}

// ── 筛选 ──
.sidebar-filter {
  padding: var(--spacing-sm) var(--spacing-base);
  border-bottom: 1px solid var(--color-border-lighter);
  flex-shrink: 0;

  :deep(.el-radio-group) {
    display: flex;
  }

  :deep(.el-radio-button__inner) {
    padding: 4px 10px;
    font-size: 12px;
  }
}

// ── 加载 ──
.sidebar-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-placeholder);
  font-size: 13px;
}

// ── 空状态 ──
.sidebar-empty {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-base);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &__icon {
    font-size: 32px;
    margin-bottom: var(--spacing-sm);
  }

  &__text {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin: 0 0 4px;
  }

  &__hint {
    font-size: 12px;
    color: var(--color-text-placeholder);
    margin: 0;
  }
}

// ── 历史列表 ──
.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs) 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;

  &:hover {
    background: var(--color-bg-secondary);

    .sidebar-item__delete {
      opacity: 1;
    }
  }

  &__icon {
    flex-shrink: 0;
    font-size: 16px;
  }

  &__info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__title {
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-top: 2px;
  }

  &__date {
    font-size: 11px;
    color: var(--color-text-placeholder);
    white-space: nowrap;
  }

  &__delete {
    opacity: 0;
    flex-shrink: 0;
    color: var(--color-text-placeholder);
    transition: opacity var(--transition-fast), color var(--transition-fast);

    &:hover {
      color: var(--color-danger) !important;
    }
  }
}

// ── 分页 ──
.sidebar-pagination {
  padding: var(--spacing-sm) var(--spacing-base);
  border-top: 1px solid var(--color-border-lighter);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

// ── 详情弹窗 ──
.detail-source-label {
  font-weight: 500;
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text);
}

.detail-source {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  font-size: var(--font-size-base, 15px);
  line-height: 1.9;
  color: var(--color-text-secondary);
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.detail-summary {
  font-size: var(--font-size-base, 15px);
  line-height: 1.9;
  color: var(--color-text);

  :deep(h2) {
    font-size: 19px;
    color: var(--color-primary);
    margin: var(--spacing-lg) 0 var(--spacing-md);
  }

  :deep(h3) {
    font-size: 16px;
    margin: var(--spacing-md) 0 var(--spacing-sm);
  }

  :deep(strong) {
    color: var(--color-primary);
  }
}

.detail-kp {
  &__title {
    font-weight: 500;
    margin: 0 0 var(--spacing-md);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
}
</style>
