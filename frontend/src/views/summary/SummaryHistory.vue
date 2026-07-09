<script setup lang="ts">
/**
 * 课文总结 — 历史记录列表 (PBI_06)
 * 独立的 Tab 组件：搜索、筛选、分页、查看详情、删除
 */
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, Search, Calendar, Collection, Loading } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { SUMMARY_MODE_LABELS } from '@/api/modules/summary'
import { renderMarkdown } from '@/utils/markdown'
import type { ISummaryItem, SummaryMode } from '@/types'

const store = useSummaryStore()

// ── 搜索 ──
const searchKeyword = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.fetchHistory(1, filterMode.value || undefined, searchKeyword.value || undefined)
  }, 400)
}

// ── 详情弹窗 ──
const detailVisible = ref(false)
const deletingId = ref<string | null>(null)

onMounted(() => {
  store.fetchHistory()
})

// ── 模式筛选 ──
const filterMode = ref<SummaryMode | ''>('')
function handleFilterChange() {
  store.fetchHistory(1, filterMode.value || undefined, searchKeyword.value || undefined)
}

// ── 分页 ──
function handlePageChange(page: number) {
  store.fetchHistory(page, filterMode.value || undefined, searchKeyword.value || undefined)
}

// ── 查看详情 ──
async function handleViewDetail(item: ISummaryItem) {
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

function getTitle(item: ISummaryItem): string {
  const text = item.source_content || '无标题'
  return text.length > 40 ? text.slice(0, 40).replace(/\n/g, ' ') + '…' : text
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return diffDays + '天前'
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const isEmpty = computed(() => !store.historyLoading && store.historyList.length === 0)
</script>

<template>
  <div class="summary-history">
    <!-- 工具栏 -->
    <div class="history-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索历史总结…"
        :prefix-icon="Search"
        clearable
        size="default"
        class="history-toolbar__search"
        @input="onSearchInput"
        @clear="store.fetchHistory(1, filterMode || undefined)"
      />
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

    <!-- 加载骨架 -->
    <div v-if="store.historyLoading" class="history-loading">
      <div v-for="i in 3" :key="i" class="skeleton-card">
        <el-skeleton animated>
          <template #template>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <el-skeleton-item variant="text" style="width: 60%; height: 20px;" />
              <el-skeleton-item variant="text" style="width: 90%; height: 16px;" />
              <div style="display: flex; gap: 12px;">
                <el-skeleton-item variant="text" style="width: 80px; height: 24px;" />
                <el-skeleton-item variant="text" style="width: 100px; height: 24px;" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="history-empty">
      <span class="history-empty__icon">{{ searchKeyword ? '🔍' : '📚' }}</span>
      <p class="history-empty__title">
        {{ searchKeyword ? '没有找到匹配的记录' : '还没有总结记录' }}
      </p>
      <p class="history-empty__desc">
        {{ searchKeyword ? '尝试其他搜索词或清除筛选条件' : '切换到「新建总结」标签页，开始你的第一篇智能总结吧！' }}
      </p>
    </div>

    <!-- 列表 -->
    <div v-else class="history-list">
      <div
        v-for="item in store.historyList"
        :key="item.id"
        class="history-card"
        @click="handleViewDetail(item)"
      >
        <div class="history-card__body">
          <div class="history-card__top">
            <div class="history-card__mode" :class="`history-card__mode--${item.mode}`">
              {{ item.mode === 'detailed' ? '📋' : '⚡' }}
              {{ SUMMARY_MODE_LABELS[item.mode] }}
            </div>
          </div>
          <h4 class="history-card__title">{{ getTitle(item) }}</h4>
          <p class="history-card__preview">{{ item.summary_text }}</p>
          <div class="history-card__footer">
            <span class="history-card__date">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(item.created_at) }}
            </span>
            <span v-if="item.knowledge_points.length > 0" class="history-card__kp">
              <el-icon><Collection /></el-icon>
              {{ item.knowledge_points.length }} 个知识点
            </span>
          </div>
        </div>
        <div class="history-card__actions" @click.stop>
          <el-button
            text
            size="small"
            type="danger"
            :loading="deletingId === item.id"
            class="history-card__delete-btn"
            @click="handleDelete(item)"
          >
            <el-icon v-if="deletingId !== item.id"><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="store.historyTotal > store.historyPageSize" class="history-pagination">
      <el-pagination
        v-model:current-page="store.historyPage"
        :page-size="store.historyPageSize"
        :total="store.historyTotal"
        :pager-count="5"
        layout="prev, pager, next, total"
        background
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      width="85%"
      top="5vh"
      :close-on-click-modal="false"
      destroy-on-close
      class="detail-dialog"
    >
      <template #header>
        <div class="detail-dialog__header">
          <span>📄 总结详情</span>
        </div>
      </template>

      <div v-if="store.detailLoading" class="detail-loading">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中…</p>
      </div>

      <div v-else-if="store.currentDetail" class="detail-body">
        <div class="detail-body__meta">
          <el-tag
            :type="store.currentDetail.mode === 'detailed' ? 'primary' : 'info'"
            effect="light"
            round
            size="small"
          >
            {{ SUMMARY_MODE_LABELS[store.currentDetail.mode] }}
          </el-tag>
          <span class="detail-body__date">{{ formatDate(store.currentDetail.created_at) }}</span>
        </div>

        <div class="detail-block">
          <div class="detail-block__header"><span>📖</span> 原文内容</div>
          <div class="detail-block__source">{{ store.currentDetail.source_content }}</div>
        </div>

        <div class="detail-block">
          <div class="detail-block__header"><span>✨</span> AI 总结</div>
          <div class="detail-block__summary" v-html="renderMarkdown(store.currentDetail.summary_text)" />
        </div>

        <div v-if="store.currentDetail.knowledge_points.length > 0" class="detail-block">
          <div class="detail-block__header">
            <span>🧠</span> 知识点 ({{ store.currentDetail.knowledge_points.length }})
          </div>
          <div class="detail-block__tags">
            <el-tag
              v-for="kp in store.currentDetail.knowledge_points"
              :key="kp.name"
              effect="light"
              round
            >
              {{ kp.category ? `${kp.category} · ${kp.name}` : kp.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.summary-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// ── 工具栏 ──
.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;

  &__search {
    width: 280px;

    :deep(.el-input__wrapper) {
      border-radius: var(--radius-round);
      background: var(--color-bg-card);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
  }
}

// ── 加载骨架 ──
.history-loading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skeleton-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

// ── 空状态 ──
.history-empty {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-xl);

  &__icon { font-size: 56px; display: block; margin-bottom: var(--spacing-lg); }

  &__title {
    font-size: 17px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: var(--spacing-sm);
  }

  &__desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

// ── 卡片列表 ──
.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-card {
  display: flex;
  align-items: stretch;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);

    .history-card__delete-btn { opacity: 1; }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__top { display: flex; align-items: center; gap: var(--spacing-sm); }

  &__mode {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 10px;
    border-radius: var(--radius-round);

    &--detailed {
      background: var(--color-primary-light);
      color: var(--color-primary-darkest);
    }

    &--brief {
      background: var(--color-info-light);
      color: var(--color-info);
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__preview {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.7;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-xs);
  }

  &__date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__kp {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-primary);
  }

  &__actions { display: flex; align-items: flex-start; padding-left: var(--spacing-md); flex-shrink: 0; }

  &__delete-btn {
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
}

// ── 分页 ──
.history-pagination {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
}

// ── 详情弹窗 ──
.detail-dialog__header {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.detail-loading {
  text-align: center;
  padding: 60px;
  color: var(--color-text-secondary);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-light);
  }

  &__date {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
}

.detail-block {
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
  }

  &__source {
    background: var(--color-bg);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    font-size: var(--font-size-base, 15px);
    line-height: 2;
    color: var(--color-text-secondary);
    max-height: 250px;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: 'Georgia', 'Noto Serif SC', 'STSong', 'SimSun', serif;
  }

  &__summary {
    font-size: var(--font-size-base, 15px);
    line-height: 2;
    color: var(--color-text);
    padding: var(--spacing-lg);
    background: var(--color-bg);
    border-radius: var(--radius-md);

    :deep(h2) { font-size: 19px; color: var(--color-primary); margin: var(--spacing-lg) 0 var(--spacing-md); }
    :deep(h3) { font-size: 16px; margin: var(--spacing-md) 0 var(--spacing-sm); }
    :deep(strong) { color: var(--color-primary-darkest); }
    :deep(ul) { padding-left: var(--spacing-xl); margin: var(--spacing-sm) 0; }
    :deep(li) { margin-bottom: var(--spacing-sm); }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
}

// ── 响应式 ──
@media (max-width: 640px) {
  .history-toolbar {
    flex-direction: column;
    align-items: stretch;

    &__search { width: 100%; }
  }
}
</style>
