<script setup lang="ts">
// ================================================================
// GradeResult — 批改结果展示
// 对应 PBI_10：总览卡片 + 逐题反馈 + 薄弱知识点汇总
// ================================================================

import { computed } from 'vue'
import type { IGradeResult, IExercise } from '@/types'
import ExerciseCard from './ExerciseCard.vue'

// ── Props ──
interface Props {
  gradeResult: IGradeResult
  exercises: IExercise[]
}

const props = defineProps<Props>()

// ── Emits ──
const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'view-history'): void
}>()

// ── 计算属性 ──
const correctRate = computed(() => {
  if (props.gradeResult.total_count === 0) return 0
  return Math.round((props.gradeResult.correct_count / props.gradeResult.total_count) * 100)
})

const maxScore = computed(() => props.gradeResult.total_count * 20) // 每题 20 分制

const allCorrect = computed(() => props.gradeResult.correct_count === props.gradeResult.total_count)

// 汇总薄弱知识点
const weakPoints = computed(() => {
  const freq: Record<string, number> = {}
  props.gradeResult.results
    .filter(r => !r.is_correct)
    .forEach(r => {
      r.related_knowledge?.forEach(kp => {
        freq[kp] = (freq[kp] || 0) + 1
      })
    })
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([kp, count]) => ({ name: kp, count }))
})

// 获取某题的批改详情
function getGradeForExercise(exerciseId: string) {
  return props.gradeResult.results.find(r => r.exercise_id === exerciseId) || null
}
</script>

<template>
  <div class="grade-result">
    <!-- ================================ -->
    <!-- 成绩总览卡片                       -->
    <!-- ================================ -->
    <div class="grade-result__summary" :class="{ 'summary--perfect': allCorrect }">
      <div class="summary__header">
        <h2 v-if="allCorrect">🎉 太棒了！全部正确！</h2>
        <h2 v-else-if="correctRate >= 80">👏 做得不错！</h2>
        <h2 v-else-if="correctRate >= 60">💪 继续加油！</h2>
        <h2 v-else>📚 需要多加练习哦</h2>
      </div>

      <div class="summary__stats">
        <!-- 总分 -->
        <div class="summary__stat">
          <div class="summary__stat-value">
            {{ gradeResult.total_score }}
            <span class="summary__stat-unit"> / {{ maxScore }}</span>
          </div>
          <div class="summary__stat-label">总分</div>
        </div>

        <!-- 正确率 -->
        <div class="summary__stat">
          <div class="summary__stat-ring">
            <el-progress
              type="circle"
              :percentage="correctRate"
              :stroke-width="8"
              :width="100"
              :color="correctRate >= 80 ? 'var(--color-success)' : correctRate >= 60 ? 'var(--color-warning)' : 'var(--color-danger)'"
            />
          </div>
          <div class="summary__stat-label">正确率</div>
        </div>

        <!-- 正确数 -->
        <div class="summary__stat">
          <div class="summary__stat-value">
            {{ gradeResult.correct_count }}
            <span class="summary__stat-unit"> / {{ gradeResult.total_count }}</span>
          </div>
          <div class="summary__stat-label">正确题数</div>
        </div>
      </div>
    </div>

    <!-- ================================ -->
    <!-- 薄弱知识点                        -->
    <!-- ================================ -->
    <div v-if="weakPoints.length > 0" class="grade-result__weak-points">
      <h3>🔍 建议加强的知识点</h3>
      <div class="weak-points__list">
        <div
          v-for="wp in weakPoints"
          :key="wp.name"
          class="weak-points__item"
        >
          <span class="weak-points__name">{{ wp.name }}</span>
          <span class="weak-points__count">错 {{ wp.count }} 次</span>
        </div>
      </div>
    </div>

    <!-- ================================ -->
    <!-- 逐题反馈                          -->
    <!-- ================================ -->
    <div class="grade-result__details">
      <h3>📋 逐题反馈</h3>
      <div class="grade-result__cards">
        <ExerciseCard
          v-for="(exercise, idx) in exercises"
          :key="exercise.id"
          :exercise="exercise"
          mode="review"
          :grade-result="getGradeForExercise(exercise.id)"
          :user-answer="(getGradeForExercise(exercise.id)?.correct_answer) || ''"
          :index="idx + 1"
        />
      </div>
    </div>

    <!-- ================================ -->
    <!-- 底部操作                          -->
    <!-- ================================ -->
    <div class="grade-result__actions">
      <el-button type="primary" size="large" @click="emit('retry')">
        🔄 再来一组
      </el-button>
      <el-button size="large" @click="emit('view-history')">
        📋 查看历史记录
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grade-result {
  max-width: 800px;
  margin: 0 auto;

  // ── 总览卡片 ──
  &__summary {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xxl);
    text-align: center;
    margin-bottom: var(--spacing-xl);

    &.summary--perfect {
      background: linear-gradient(135deg, var(--color-success-light), var(--color-bg-card));
      border-color: var(--color-success);
    }
  }

  // ── 薄弱知识点 ──
  &__weak-points {
    background: var(--color-warning-light);
    border: 1px solid var(--color-warning);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);

    h3 {
      font-size: var(--font-size-base);
      margin-bottom: var(--spacing-sm);
    }
  }

  // ── 逐题反馈 ──
  &__details {
    h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-base);
    }
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  // ── 底部操作 ──
  &__actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-base);
    margin-top: var(--spacing-xxl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-border-light);
  }
}

// 总览统计
.summary {
  &__header {
    margin-bottom: var(--spacing-xl);

    h2 {
      font-size: var(--font-size-h2);
    }
  }

  &__stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-xxxl);
  }

  &__stat {
    text-align: center;
  }

  &__stat-value {
    font-size: 32px;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__stat-unit {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-normal);
  }

  &__stat-ring {
    margin-bottom: var(--spacing-xs);
  }

  &__stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }
}

// 薄弱知识点
.weak-points {
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
    font-size: var(--font-size-sm);
  }

  &__name {
    font-weight: var(--font-weight-medium);
  }

  &__count {
    color: var(--color-danger);
    font-weight: var(--font-weight-medium);
  }
}

// ── 响应式 ──
@media (max-width: 640px) {
  .summary__stats {
    flex-direction: column;
    gap: var(--spacing-xl);
  }
}
</style>
