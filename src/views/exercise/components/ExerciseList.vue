<script setup lang="ts">
// ================================================================
// ExerciseList — 习题列表容器
// 对应 PBI_09：做题/解析双模式切换 + 答题进度 + 提交批改
// ================================================================

import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { IExercise, IGradeResult, ExerciseMode } from '@/types'
import ExerciseCard from './ExerciseCard.vue'

// ── Props ──
interface Props {
  exercises: IExercise[]
  batchId: string
  gradeResult: IGradeResult | null
}

const props = defineProps<Props>()

// ── Emits ──
const emit = defineEmits<{
  (e: 'submit', answers: Array<{ exercise_id: string; user_answer: string }>): void
  (e: 'back-to-config'): void
}>()

// ── 内部状态 ──
const mode = ref<ExerciseMode>('practice')
const answers = ref<Record<string, string>>({})

// ── 计算属性 ──
const answeredCount = computed(() => Object.keys(answers.value).filter(k => answers.value[k]?.trim()).length)
const totalCount = computed(() => props.exercises.length)
const allAnswered = computed(() => answeredCount.value === totalCount.value)
const isGraded = computed(() => !!props.gradeResult)

// ── 更新答案 ──
function updateAnswer(exerciseId: string, answer: string) {
  answers.value[exerciseId] = answer
}

// ── 模式切换 ──
async function switchMode(newMode: ExerciseMode) {
  if (newMode === mode.value) return

  // 切换到解析模式且未批改 → 确认弹窗
  if (newMode === 'review' && !isGraded.value) {
    try {
      await ElMessageBox.confirm(
        '解析模式会显示标准答案和解题思路，确定要切换吗？建议先完成作答再查看解析。',
        '切换至解析模式',
        { confirmButtonText: '确定切换', cancelButtonText: '继续做题', type: 'warning' }
      )
    } catch {
      return
    }
  }

  mode.value = newMode
}

// ── 提交批改 ──
async function handleSubmit() {
  if (!allAnswered.value) {
    const unanswered = totalCount.value - answeredCount.value
    try {
      await ElMessageBox.confirm(
        `还有 ${unanswered} 题未作答，确定要提交吗？未作答的题目将得 0 分。`,
        '确认提交',
        { confirmButtonText: '确定提交', cancelButtonText: '继续作答', type: 'warning' }
      )
    } catch {
      return
    }
  }

  const answerList = props.exercises.map(ex => ({
    exercise_id: ex.id,
    user_answer: answers.value[ex.id] || '',
  }))
  emit('submit', answerList)
}

// ── 获取某题的批改详情 ──
function getGradeForExercise(exerciseId: string) {
  return props.gradeResult?.results?.find(r => r.exercise_id === exerciseId) || null
}
</script>

<template>
  <div class="exercise-list">
    <!-- 顶部工具栏 -->
    <div class="exercise-list__toolbar">
      <div class="exercise-list__mode-switch">
        <el-button
          :type="mode === 'practice' ? 'primary' : 'default'"
          size="default"
          @click="switchMode('practice')"
        >
          ✏️ 做题模式
        </el-button>
        <el-button
          :type="mode === 'review' ? 'primary' : 'default'"
          size="default"
          @click="switchMode('review')"
        >
          📖 解析模式
        </el-button>
      </div>

      <div class="exercise-list__progress">
        <el-progress
          :percentage="Math.round((answeredCount / totalCount) * 100)"
          :stroke-width="8"
          :show-text="false"
          style="width: 120px"
        />
        <span class="exercise-list__progress-text">
          {{ answeredCount }} / {{ totalCount }} 题已答
        </span>
      </div>

      <div class="exercise-list__actions">
        <el-button @click="emit('back-to-config')">返回重选</el-button>
        <el-button
          v-if="!isGraded"
          type="success"
          :disabled="answeredCount === 0"
          @click="handleSubmit"
        >
          提交批改
        </el-button>
        <el-tag v-else type="success" size="large">已批改</el-tag>
      </div>
    </div>

    <!-- 习题列表 -->
    <div class="exercise-list__cards">
      <ExerciseCard
        v-for="(exercise, idx) in exercises"
        :key="exercise.id"
        :exercise="exercise"
        :mode="mode"
        :user-answer="answers[exercise.id]"
        :grade-result="getGradeForExercise(exercise.id)"
        :index="idx + 1"
        @update:answer="(ans: string) => updateAnswer(exercise.id, ans)"
      />
    </div>

    <!-- 底部提交 -->
    <div v-if="!isGraded" class="exercise-list__bottom-bar">
      <el-button
        type="success"
        size="large"
        :disabled="answeredCount === 0"
        @click="handleSubmit"
      >
        {{ allAnswered ? '✅ 提交批改' : `提交批改（${answeredCount}/${totalCount} 已答）` }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exercise-list {
  max-width: 800px;
  margin: 0 auto;

  // ── 工具栏 ──
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-base);
    padding: var(--spacing-base) var(--spacing-lg);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-xl);
    position: sticky;
    top: calc(var(--header-height) + var(--spacing-base));
    z-index: 10;
    box-shadow: var(--shadow-sm);
  }

  &__mode-switch {
    display: flex;
    gap: var(--spacing-xs);
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__progress-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  // ── 习题卡片列表 ──
  &__cards {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  // ── 底部栏 ──
  &__bottom-bar {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-xl);
    padding-top: var(--spacing-xl);
    border-top: 1px solid var(--color-border-light);
  }
}

// ── 响应式 ──
@media (max-width: 768px) {
  .exercise-list__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .exercise-list__progress {
    justify-content: center;
  }

  .exercise-list__actions {
    justify-content: center;
  }
}
</style>
