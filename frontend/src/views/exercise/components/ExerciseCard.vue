<script setup lang="ts">
// ================================================================
// ExerciseCard — 单道习题卡片
// 对应 PBI_08/09/10：5 种题型 × 2 种模式 + 批改反馈
// ================================================================

import { computed } from 'vue'
import type { IExercise, IGradedItem, ExerciseMode, QuestionType, Difficulty } from '@/types'

// ── 题型元信息 ──
const TYPE_META: Record<QuestionType, { label: string; color: string }> = {
  choice: { label: '选择题', color: '#5B9BD5' },
  fill: { label: '填空题', color: '#67C23A' },
  short_answer: { label: '简答题', color: '#E6A23C' },
  calculation: { label: '计算题', color: '#909399' },
  analysis: { label: '辨析题', color: '#F56C6C' },
}

const DIFFICULTY_META: Record<Difficulty, { label: string; type: '' | 'success' | 'warning' | 'danger' }> = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' },
}

// ── Props ──
interface Props {
  exercise: IExercise
  mode: ExerciseMode
  userAnswer?: string
  gradeResult?: IGradedItem | null
  index: number
}

const props = withDefaults(defineProps<Props>(), {
  userAnswer: '',
  gradeResult: null,
})

// ── Emits ──
const emit = defineEmits<{
  (e: 'update:answer', answer: string): void
}>()

// ── 计算属性 ──
const typeMeta = computed(() => TYPE_META[props.exercise.question_type])
const diffMeta = computed(() => DIFFICULTY_META[props.exercise.difficulty])
const isReview = computed(() => props.mode === 'review')
const isGraded = computed(() => !!props.gradeResult)
const showCorrectAnswer = computed(() => isReview.value || isGraded.value)
const showAnalysis = computed(() => isReview.value || isGraded.value)

// 选择题：判断某个选项的状态
function getOptionClass(optionLabel: string) {
  if (!isGraded.value && !isReview.value) return ''
  const correct = props.exercise.answer
  const user = props.gradeResult?.correct_answer || props.userAnswer

  if (optionLabel === correct) return 'option--correct'
  if (isGraded.value && optionLabel === user && !props.gradeResult?.is_correct) return 'option--wrong'
  return ''
}

// 输入变更
function onInputChange(value: string) {
  emit('update:answer', value)
}

// 选择题选择
function onChoiceSelect(value: string) {
  emit('update:answer', value)
}
</script>

<template>
  <div class="exercise-card" :class="{ 'exercise-card--graded': isGraded && !gradeResult?.is_correct, 'exercise-card--correct': isGraded && gradeResult?.is_correct }">
    <!-- 题头：题号 + 题型标签 + 难度标签 -->
    <div class="exercise-card__header">
      <span class="exercise-card__index">第 {{ index }} 题</span>
      <el-tag
        :color="typeMeta.color"
        effect="dark"
        size="small"
        class="exercise-card__type-tag"
      >
        {{ typeMeta.label }}
      </el-tag>
      <el-tag
        :type="diffMeta.type"
        size="small"
        class="exercise-card__diff-tag"
      >
        {{ diffMeta.label }}
      </el-tag>
      <span class="exercise-card__knowledge">
        {{ exercise.knowledge_points.join(' · ') }}
      </span>
    </div>

    <!-- 题目内容 -->
    <div class="exercise-card__question">{{ exercise.question }}</div>

    <!-- ================================ -->
    <!-- 选择题                            -->
    <!-- ================================ -->
    <div v-if="exercise.question_type === 'choice' && exercise.options?.length" class="exercise-card__choices">
      <div
        v-for="(opt, optIdx) in exercise.options"
        :key="optIdx"
        class="exercise-card__option"
        :class="getOptionClass(opt)"
      >
        <template v-if="!showCorrectAnswer">
          <!-- practice 模式：可交互 radio -->
          <el-radio
            :model-value="userAnswer"
            :value="opt"
            @change="onChoiceSelect"
          >
            <span class="option-label">{{ String.fromCharCode(65 + optIdx) }}.</span> {{ opt }}
          </el-radio>
        </template>
        <template v-else>
          <!-- review / graded：只读展示 -->
          <span class="option-label" :class="getOptionClass(opt)">{{ String.fromCharCode(65 + optIdx) }}.</span>
          <span :class="getOptionClass(opt)">{{ opt }}</span>
          <span v-if="getOptionClass(opt) === 'option--correct'" class="option-badge">✓ 正确答案</span>
          <span v-if="getOptionClass(opt) === 'option--wrong'" class="option-badge option-badge--wrong">✗ 你的选择</span>
        </template>
      </div>
    </div>

    <!-- ================================ -->
    <!-- 填空 / 计算题                     -->
    <!-- ================================ -->
    <div v-else-if="exercise.question_type === 'fill' || exercise.question_type === 'calculation'" class="exercise-card__input-area">
      <template v-if="!showCorrectAnswer">
        <el-input
          :model-value="userAnswer"
          :placeholder="exercise.question_type === 'calculation' ? '请输入计算过程和答案' : '请输入答案'"
          @input="onInputChange"
        />
      </template>
    </div>

    <!-- ================================ -->
    <!-- 简答 / 辨析题                     -->
    <!-- ================================ -->
    <div v-else-if="exercise.question_type === 'short_answer' || exercise.question_type === 'analysis'" class="exercise-card__input-area">
      <template v-if="!showCorrectAnswer">
        <el-input
          :model-value="userAnswer"
          type="textarea"
          :rows="4"
          :placeholder="exercise.question_type === 'analysis' ? '请从正反两方面进行分析...' : '请输入你的答案...'"
          @input="onInputChange"
        />
      </template>
    </div>

    <!-- ================================ -->
    <!-- 答案 & 解析区（review 或 graded）  -->
    <!-- ================================ -->
    <div v-if="showCorrectAnswer" class="exercise-card__answer-section">
      <!-- 用户答案 vs 正确答案 -->
      <div v-if="isGraded" class="exercise-card__answer-compare">
        <div class="exercise-card__user-answer" v-if="userAnswer">
          <span class="answer-label">你的答案：</span>
          <span :class="gradeResult?.is_correct ? 'text-correct' : 'text-wrong'">{{ userAnswer || '未作答' }}</span>
        </div>
        <div class="exercise-card__correct-answer">
          <span class="answer-label">正确答案：</span>
          <span class="text-correct">{{ exercise.answer || gradeResult?.correct_answer }}</span>
        </div>
      </div>

      <div v-else class="exercise-card__correct-answer">
        <span class="answer-label">参考答案：</span>
        <span>{{ exercise.answer }}</span>
      </div>

      <!-- 解析 -->
      <div v-if="exercise.analysis" class="exercise-card__analysis">
        <span class="answer-label">📝 解析：</span>
        <p>{{ exercise.analysis }}</p>
      </div>

      <!-- 错误原因（批改后且答错时） -->
      <div v-if="isGraded && !gradeResult?.is_correct && gradeResult?.error_reason" class="exercise-card__error-reason">
        <span class="answer-label">🔍 错误原因：</span>
        <p>{{ gradeResult?.error_reason }}</p>
      </div>

      <!-- 关联知识点 -->
      <div v-if="isGraded && gradeResult?.related_knowledge?.length" class="exercise-card__related">
        <span class="answer-label">📚 相关知识：</span>
        <el-tag
          v-for="kp in gradeResult.related_knowledge"
          :key="kp"
          size="small"
          type="info"
          class="exercise-card__kp-tag"
        >
          {{ kp }}
        </el-tag>
      </div>
    </div>

    <!-- ================================ -->
    <!-- 批改结果标签（graded 状态）        -->
    <!-- ================================ -->
    <div v-if="isGraded" class="exercise-card__grade-bar" :class="gradeResult!.is_correct ? 'grade-bar--correct' : 'grade-bar--wrong'">
      <span v-if="gradeResult!.is_correct">✅ 回答正确</span>
      <span v-else>❌ 回答错误</span>
      <span class="grade-bar__score">{{ gradeResult!.score }} 分</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exercise-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-sm);
  }

  &--graded {
    border-left: 4px solid var(--color-danger);
  }

  &--correct {
    border-left: 4px solid var(--color-success);
  }

  // ── 题头 ──
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
    flex-wrap: wrap;
  }

  &__index {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
  }

  &__type-tag {
    // color set inline via prop
  }

  &__diff-tag {
    // Element Plus handles type color
  }

  &__knowledge {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    margin-left: auto;
  }

  // ── 题目 ──
  &__question {
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
    line-height: var(--line-height-base);
    margin-bottom: var(--spacing-lg);
    white-space: pre-wrap;
  }

  // ── 选择题选项 ──
  &__choices {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__option {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }

  // ── 输入区 ──
  &__input-area {
    margin-bottom: var(--spacing-base);
  }

  // ── 答案 & 解析 ──
  &__answer-section {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-base);
    background: var(--color-bg);
    border-radius: var(--radius-sm);
  }

  &__answer-compare {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  &__user-answer {
    font-size: var(--font-size-sm);
  }

  &__correct-answer {
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-sm);
  }

  &__analysis {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);

    p {
      margin-top: var(--spacing-xs);
      line-height: var(--line-height-base);
    }
  }

  &__error-reason {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    background: var(--color-danger-light);
    padding: var(--spacing-sm) var(--spacing-base);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-sm);

    p {
      margin-top: var(--spacing-xs);
    }
  }

  &__related {
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  &__kp-tag {
    margin: 0;
  }

  // ── 批改结果栏 ──
  &__grade-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--spacing-base);
    padding: var(--spacing-sm) var(--spacing-base);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
}

// ── 选项状态 ──
.option-label {
  font-weight: var(--font-weight-medium);
  margin-right: var(--spacing-xs);
}

.option--correct {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.option--wrong {
  color: var(--color-danger);
  text-decoration: line-through;
}

.option-badge {
  font-size: var(--font-size-xs);
  margin-left: var(--spacing-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);

  &--wrong {
    color: var(--color-danger);
  }
}

// ── 答案文本 ──
.answer-label {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-xs);
}

.text-correct {
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

.text-wrong {
  color: var(--color-danger);
  text-decoration: line-through;
}

// ── 批改栏 ──
.grade-bar--correct {
  background: var(--color-success-light);
  color: var(--color-success);
}

.grade-bar--wrong {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.grade-bar__score {
  font-weight: var(--font-weight-bold);
}
</style>
