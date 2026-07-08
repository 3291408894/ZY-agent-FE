<script setup lang="ts">
// ================================================================
// ExerciseHistory — 历史练习记录
// 分页展示历史练习，点击查看详情
// ================================================================

import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getExerciseHistory, deleteExerciseBatch } from '@/api/modules/exercise'
import type { IExerciseBatch } from '@/types'

// ── Emits ──
const emit = defineEmits<{
  (e: 'view-detail', batchId: string): void
  (e: 'back'): void
}>()

// ── 状态 ──
const records = ref<IExerciseBatch[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// ── 计算属性 ──
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ── 薄弱知识点汇总 ──
const weakPointsSummary = computed(() => {
  const freq: Record<string, number> = {}
  records.value.forEach(record => {
    if (record.grade_result) {
      record.grade_result.results
        .filter(r => !r.is_correct)
        .forEach(r => {
          r.related_knowledge?.forEach(kp => {
            freq[kp] = (freq[kp] || 0) + 1
          })
        })
    }
  })
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([kp, count]) => ({ name: kp, count }))
})

// ── 加载数据 ──
async function loadHistory() {
  loading.value = true
  try {
    const res: any = await getExerciseHistory({ page: page.value, page_size: pageSize.value })
    // API 返回分页结构 { items, total, page, page_size, total_pages }
    records.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadHistory()
}

// ── 格式化 ──
function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getCorrectCount(record: IExerciseBatch) {
  return record.grade_result?.correct_count
}

function getTotalCount(record: IExerciseBatch) {
  return record.grade_result?.total_count || record.exercises?.length || 0
}

function getCorrectRate(record: IExerciseBatch) {
  const total = getTotalCount(record)
  if (!total) return null
  const correct = getCorrectCount(record) || 0
  return Math.round((correct / total) * 100)
}

function getSubjects(record: IExerciseBatch) {
  const subjects = new Set(record.exercises?.map(e => e.subject) || [])
  return [...subjects].join('、')
}

// ── 删除 ──
async function handleDelete(batchId: string) {
  try {
    await deleteExerciseBatch(batchId)
    ElMessage.success('已删除')
    loadHistory()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="exercise-history">
    <div class="exercise-history__header">
      <div>
        <h2>练习记录</h2>
        <p class="exercise-history__subtitle">共 {{ total }} 条记录</p>
      </div>
      <el-button @click="emit('back')">返回出题</el-button>
    </div>

    <!-- ── 薄弱知识点汇总 ── -->
    <div v-if="weakPointsSummary.length > 0" class="weak-summary">
      <h3>🔍 薄弱知识点汇总</h3>
      <p class="weak-summary__subtitle">根据历史错题统计，以下知识点需要加强练习：</p>
      <div class="weak-summary__list">
        <div
          v-for="wp in weakPointsSummary"
          :key="wp.name"
          class="weak-summary__item"
        >
          <span class="weak-summary__name">{{ wp.name }}</span>
          <el-tag type="danger" size="small" effect="dark">错 {{ wp.count }} 次</el-tag>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && records.length === 0" class="empty-state">
      <div class="empty-state__icon">📝</div>
      <div class="empty-state__text">还没有练习记录</div>
      <el-button type="primary" style="margin-top: var(--spacing-lg)" @click="emit('back')">
        去出题
      </el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="exercise-history__loading">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 记录列表 -->
    <div v-if="!loading && records.length > 0" class="exercise-history__list">
      <div
        v-for="record in records"
        :key="record.id"
        class="history-item card-hover"
        @click="emit('view-detail', record.id)"
      >
        <div class="history-item__main">
          <div class="history-item__info">
            <span class="history-item__date">{{ formatDate(record.created_at) }}</span>
            <span class="history-item__subjects">{{ getSubjects(record) }}</span>
            <div class="history-item__tags">
              <el-tag
                v-for="kp in record.exercises?.[0]?.knowledge_points?.slice(0, 3) || []"
                :key="kp"
                size="small"
                type="info"
              >
                {{ kp }}
              </el-tag>
            </div>
          </div>

          <div class="history-item__stats">
            <template v-if="record.grade_result">
              <span class="history-item__score">
                {{ record.grade_result.total_score }} 分
              </span>
              <span class="history-item__rate" :class="{
                'text-success': (getCorrectRate(record) || 0) >= 80,
                'text-warning': (getCorrectRate(record) || 0) >= 60 && (getCorrectRate(record) || 0) < 80,
                'text-danger': (getCorrectRate(record) || 0) < 60,
              }">
                正确率 {{ getCorrectRate(record) }}%
              </span>
              <span class="history-item__count">
                {{ getCorrectCount(record) }}/{{ getTotalCount(record) }} 题
              </span>
            </template>
            <template v-else>
              <el-tag type="warning" size="small">未批改</el-tag>
              <span class="history-item__count">{{ record.exercises?.length || 0 }} 题</span>
            </template>
          </div>
        </div>

        <div class="history-item__actions" @click.stop>
          <el-button
            type="danger"
            size="small"
            text
            @click="handleDelete(record.id)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="exercise-history__pagination">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exercise-history {
  max-width: 800px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);

    h2 {
      font-size: var(--font-size-h2);
    }
  }

  &__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }

  &__loading {
    padding: var(--spacing-xl);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-xl);
  }
}

// 历史记录项
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  cursor: pointer;

  &__main {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
    flex: 1;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    min-width: 0;
  }

  &__date {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__subjects {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    flex-shrink: 0;
  }

  &__score {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
  }

  &__rate {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  &__count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__actions {
    flex-shrink: 0;
    margin-left: var(--spacing-base);
  }
}

// 颜色辅助
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-danger { color: var(--color-danger); }

// ── 薄弱知识点汇总 ──
.weak-summary {
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  h3 {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-xs);
  }

  &__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-md);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-base);
    background: white;
    border-radius: var(--radius-sm);
  }

  &__name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
}

// ── 响应式 ──
@media (max-width: 640px) {
  .history-item__main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>
