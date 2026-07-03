<script setup lang="ts">
/**
 * 课文总结 — 历史记录列表 (PBI_06)
 * 展示历史总结记录，支持分页、筛选、查看详情、删除
 */
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Delete, Loading } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { SUMMARY_MODE_LABELS } from '@/api/modules/summary'
import { renderMarkdown } from '@/utils/markdown'
import type { ISummaryItem, SummaryMode } from '@/types'

const store = useSummaryStore()

// ── 详情弹窗 ──
const detailVisible = ref(false)
const viewingSummaryId = ref<string | null>(null)
const deletingId = ref<string | null>(null)  // 正在删除的记录 ID

// ── 加载 ──
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

// ── 查看详情 ──
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
  <div class="summary-history">
    <!-- ── 筛选栏 ── -->
    <div class="history-toolbar">
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

    <!-- ── 加载中 ── -->
    <div v-if="store.historyLoading" class="history-loading">
      <el-skeleton animated :count="3" />
    </div>

    <!-- ── 空状态 ── -->
    <el-empty
      v-else-if="isEmpty"
      description="暂无总结记录，快去创建你的第一篇总结吧！"
      :image-size="120"
    />

    <!-- ── 列表 ── -->
    <div v-else class="history-list">
      <div
        v-for="item in store.historyList"
        :key="item.id"
        class="history-card"
        @click="handleViewDetail(item)"
      >
        <div class="history-card__body">
          <div class="history-card__info">
            <h4 class="history-card__title">{{ getTitle(item) }}</h4>
            <p class="history-card__preview">{{ item.summary_text }}</p>
            <div class="history-card__meta">
              <el-tag
                size="small"
                :type="item.mode === 'detailed' ? 'primary' : 'info'"
                effect="light"
              >
                {{ SUMMARY_MODE_LABELS[item.mode] }}
              </el-tag>
              <span class="history-card__date">{{ formatDate(item.created_at) }}</span>
              <span
                v-if="item.knowledge_points.length > 0"
                class="history-card__kp-count"
              >
                {{ item.knowledge_points.length }} 个知识点
              </span>
            </div>
          </div>
        </div>
        <div
          class="history-card__actions"
          @click.stop
        >
          <el-button
            text
            size="small"
            type="danger"
            :loading="deletingId === item.id"
            @click="handleDelete(item)"
          >
            <el-icon v-if="deletingId !== item.id"><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- ── 分页 ── -->
    <div v-if="store.historyTotal > store.historyPageSize" class="history-pagination">
      <el-pagination
        v-model:current-page="store.historyPage"
        :page-size="store.historyPageSize"
        :total="store.historyTotal"
        :pager-count="5"
        layout="prev, pager, next, total"
        @current-change="handlePageChange"
      />
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
.summary-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// ── 工具栏 ──
.history-toolbar {
  display: flex;
  align-items: center;
}

// ── 加载 ──
.history-loading {
  padding: var(--spacing-xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
}

// ── 卡片列表 ──
.history-card {
  display: flex;
  align-items: stretch;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
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
    line-height: 1.6;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__date {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  &__kp-count {
    font-size: 12px;
    color: var(--color-primary);
  }

  &__actions {
    display: flex;
    align-items: flex-start;
    padding-left: var(--spacing-md);
  }
}

// ── 分页 ──
.history-pagination {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
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
