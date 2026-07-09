<script setup lang="ts">
// ================================================================
// ExerciseHistory — 历史练习记录（按批次分组展示）
// ================================================================

import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExerciseHistory, getExerciseBatch, deleteExerciseBatch } from '@/api/modules/exercise'
import type { IExercise, IExerciseBatch, IGradeResult } from '@/types'
import ExerciseCard from './ExerciseCard.vue'

// ── Emits ──
const emit = defineEmits<{
  (e: 'view-detail', batchId: string): void
  (e: 'back'): void
}>()

// ── 状态 ──
interface IBatchSummary {
  batch_id: string
  subject: string
  grade: string
  difficulty: string
  exercise_count: number
  graded_count: number
  correct_count: number
  knowledge_points: string[]
  weak_knowledge_points: string[]
  created_at: string
}

const records = ref<IBatchSummary[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 展开详情
const expandedBatchId = ref<string | null>(null)
const detailExercises = ref<IExercise[]>([])
const detailGradeResult = ref<IGradeResult | null>(null)
const detailLoading = ref(false)

// ── 计算属性 ──
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ── 加载历史列表 ──
async function loadHistory() {
  loading.value = true
  try {
    const res: any = await getExerciseHistory({ page: page.value, page_size: pageSize.value })
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
  expandedBatchId.value = null
  loadHistory()
}

// ── 展开/折叠批次详情 ──
async function toggleBatchDetail(batchId: string) {
  if (expandedBatchId.value === batchId) {
    expandedBatchId.value = null
    return
  }
  expandedBatchId.value = batchId
  detailLoading.value = true
  try {
    const detail: any = await getExerciseBatch(batchId)
    detailExercises.value = detail.exercises || []
    detailGradeResult.value = detail.grade_result || null
  } catch (e: any) {
    ElMessage.error(e?.message || '加载详情失败')
    expandedBatchId.value = null
  } finally {
    detailLoading.value = false
  }
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

function formatFullDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getCorrectRate(record: IBatchSummary) {
  if (!record.graded_count) return null
  return Math.round((record.correct_count / record.exercise_count) * 100)
}

function getStatusTag(record: IBatchSummary) {
  if (!record.graded_count) return { label: '未作答', type: 'info' as const }
  const rate = getCorrectRate(record) || 0
  if (rate >= 80) return { label: '优秀', type: 'success' as const }
  if (rate >= 60) return { label: '良好', type: 'warning' as const }
  return { label: '需加强', type: 'danger' as const }
}

// ── 删除 ──
async function handleDelete(batchId: string) {
  try {
    await ElMessageBox.confirm('确定要删除这组练习记录吗？删除后不可恢复。', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 用户取消或关闭弹窗，不做任何操作
    return
  }
  try {
    await deleteExerciseBatch(batchId)
    ElMessage.success('已删除')
    if (expandedBatchId.value === batchId) expandedBatchId.value = null
    loadHistory()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function getGradeForExercise(exerciseId: string) {
  return null // detail view shows in review mode
}

// ── 获取某题的用户答案 ──
function getUserAnswer(exercise: any) {
  return exercise.user_answer || ''
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="exercise-history">
    <!-- 头部 -->
    <div class="exercise-history__header">
      <div>
        <h2>📋 练习记录</h2>
        <p class="exercise-history__subtitle">共 {{ total }} 组练习</p>
      </div>
      <el-button @click="emit('back')">← 返回出题</el-button>
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

    <!-- 批次列表 -->
    <div v-if="!loading && records.length > 0" class="exercise-history__list">
      <div
        v-for="record in records"
        :key="record.batch_id"
        class="batch-card"
      >
        <!-- 批次摘要 -->
        <div class="batch-card__summary" @click="toggleBatchDetail(record.batch_id)">
          <div class="batch-card__left">
            <!-- 日期 -->
            <div class="batch-card__date">
              <div class="batch-card__date-day">{{ formatDate(record.created_at) }}</div>
              <div class="batch-card__date-full">{{ formatFullDate(record.created_at) }}</div>
            </div>
            <!-- 信息 -->
            <div class="batch-card__info">
              <div class="batch-card__title">
                {{ record.subject }} · {{ record.grade }}
                <el-tag size="small" :type="record.difficulty === 'easy' ? 'success' : record.difficulty === 'medium' ? 'warning' : 'danger'">
                  {{ record.difficulty === 'easy' ? '简单' : record.difficulty === 'medium' ? '中等' : '困难' }}
                </el-tag>
              </div>
              <div class="batch-card__knowledge">
                <el-tag
                  v-for="kp in record.knowledge_points.slice(0, 4)"
                  :key="kp"
                  size="small"
                  type="info"
                >
                  {{ kp }}
                </el-tag>
                <span v-if="record.knowledge_points.length > 4" class="batch-card__more-kp">
                  +{{ record.knowledge_points.length - 4 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 统计 -->
          <div class="batch-card__stats">
            <el-tag :type="getStatusTag(record).type" effect="plain" size="small">
              {{ getStatusTag(record).label }}
            </el-tag>
            <div class="batch-card__stat-item">
              <span class="batch-card__stat-value">{{ record.exercise_count }}</span>
              <span class="batch-card__stat-label">题</span>
            </div>
            <template v-if="record.graded_count > 0">
              <div class="batch-card__stat-divider"></div>
              <div class="batch-card__stat-item">
                <span class="batch-card__stat-value text-success">{{ record.correct_count }}</span>
                <span class="batch-card__stat-label">对</span>
              </div>
              <div class="batch-card__stat-item">
                <span class="batch-card__stat-value" :class="getCorrectRate(record)! >= 80 ? 'text-success' : getCorrectRate(record)! >= 60 ? 'text-warning' : 'text-danger'">
                  {{ getCorrectRate(record) }}%
                </span>
                <span class="batch-card__stat-label">正确率</span>
              </div>
            </template>
            <el-icon class="batch-card__chevron" :class="{ 'is-expanded': expandedBatchId === record.batch_id }">
              <ArrowDown />
            </el-icon>
          </div>
        </div>

        <!-- 删除按钮 -->
        <div class="batch-card__actions-row">
          <el-button type="danger" size="small" text @click.stop="handleDelete(record.batch_id)">
            删除
          </el-button>
        </div>

        <!-- 展开的习题详情 -->
        <div v-if="expandedBatchId === record.batch_id" class="batch-card__detail">
          <div v-if="detailLoading" class="batch-card__detail-loading">
            <el-skeleton :rows="2" animated />
          </div>
          <div v-else class="batch-card__exercises">
            <ExerciseCard
              v-for="(exercise, idx) in detailExercises"
              :key="exercise.id"
              :exercise="exercise"
              mode="review"
              :user-answer="getUserAnswer(exercise)"
              :grade-result="null"
              :index="idx + 1"
            />
          </div>

          <!-- 批次成绩总览 -->
          <div v-if="detailGradeResult" class="batch-card__grade-summary">
            <span>📊 本组成绩：</span>
            <strong>{{ detailGradeResult.total_score }} 分</strong>
            <span class="batch-card__grade-divider">|</span>
            <span>正确 {{ detailGradeResult.correct_count }}/{{ detailGradeResult.total_count }} 题</span>
          </div>
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
  max-width: 860px;
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

// ── 批次卡片 ──
.batch-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-sm);
  }

  &__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    cursor: pointer;
    user-select: none;
    gap: var(--spacing-base);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    min-width: 0;
    flex: 1;
  }

  &__date {
    flex-shrink: 0;
    text-align: center;
    min-width: 56px;
  }

  &__date-day {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
  }

  &__date-full {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    margin-top: 2px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    min-width: 0;
  }

  &__title {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__knowledge {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  &__more-kp {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }

  &__stat-item {
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  &__stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  &__stat-divider {
    width: 1px;
    height: 24px;
    background: var(--color-border-light);
  }

  &__chevron {
    color: var(--color-text-secondary);
    transition: transform var(--transition-fast);

    &.is-expanded {
      transform: rotate(180deg);
    }
  }

  &__actions-row {
    display: flex;
    justify-content: flex-end;
    padding: 0 var(--spacing-lg) var(--spacing-sm);
  }

  // ── 展开详情 ──
  &__detail {
    border-top: 1px solid var(--color-border-light);
    padding: var(--spacing-lg);
    background: var(--color-bg);
  }

  &__detail-loading {
    padding: var(--spacing-base) 0;
  }

  &__exercises {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  &__grade-summary {
    margin-top: var(--spacing-base);
    padding: var(--spacing-sm) var(--spacing-base);
    background: var(--color-primary-lighter);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);

    strong {
      color: var(--color-primary);
      font-size: var(--font-size-base);
    }
  }

  &__grade-divider {
    margin: 0 var(--spacing-sm);
    color: var(--color-border);
  }
}

// ── 空状态 ──
.empty-state {
  text-align: center;
  padding: var(--spacing-xxxl) 0;

  &__icon { font-size: 48px; }
  &__text {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-sm);
  }
}

// ── 颜色辅助 ──
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-danger { color: var(--color-danger); }

// ── 响应式 ──
@media (max-width: 640px) {
  .batch-card {
    &__summary {
      flex-direction: column;
      align-items: flex-start;
    }

    &__left {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    &__stats {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
