<script setup lang="ts">
/**
 * 学生端 — 作答组件
 */
import { ref, reactive, computed } from 'vue'
import type { IAssignmentContent } from '@/types'
import MathRenderer from '@/components/common/MathRenderer.vue'

const props = defineProps<{
  content: IAssignmentContent
  disabled: boolean
  submitting: boolean
}>()
const emit = defineEmits<{ submit: [answers: { question_number: number; answer: string }[]] }>()

// 初始化答案映射
const allQuestions = computed(() => {
  const qs: Array<{ number: number; stem: string; type: string; options?: string[]; score: number }> = []
  for (const section of props.content.sections) {
    for (const q of section.questions) {
      qs.push({ ...q, type: section.type })
    }
  }
  return qs
})

const answers = reactive<Record<number, string>>({})

function initAnswers() {
  for (const q of allQuestions.value) {
    if (!(q.number in answers)) {
      answers[q.number] = ''
    }
  }
}
initAnswers()

function handleSubmit() {
  const result = allQuestions.value.map((q) => ({
    question_number: q.number,
    answer: answers[q.number] || '',
  }))
  emit('submit', result)
}

function isAnswered(num: number) {
  return !!answers[num]?.trim()
}

const answeredCount = computed(() => allQuestions.value.filter((q) => isAnswered(q.number)).length)
</script>

<template>
  <div class="answer-sheet">
    <div class="progress-bar">
      <span>已作答：{{ answeredCount }} / {{ allQuestions.length }} 题</span>
      <el-progress
        :percentage="Math.round((answeredCount / allQuestions.length) * 100)"
        :color="answeredCount === allQuestions.length ? '#67c23a' : '#409eff'"
        style="flex: 1; max-width: 300px"
      />
    </div>

    <div
      v-for="q in allQuestions"
      :key="q.number"
      class="question-block"
      :class="{ answered: isAnswered(q.number) }"
    >
      <div class="q-header">
        <span class="q-num">第{{ q.number }}题</span>
        <el-tag size="small" :type="q.type === 'objective' ? 'info' : 'warning'">
          {{ q.type === 'objective' ? '客观题' : '主观题' }}
        </el-tag>
        <span class="q-score">（{{ q.score }}分）</span>
      </div>
      <div class="q-stem"><MathRenderer :text="q.stem" /></div>

      <!-- 选择题 -->
      <template v-if="q.type === 'objective' && q.options?.length">
        <el-radio-group v-model="answers[q.number]" :disabled="disabled" class="options-group">
          <el-radio
            v-for="(opt, oi) in q.options"
            :key="oi"
            :value="String.fromCharCode(65 + oi)"
            class="option-item"
          >
            <MathRenderer :text="opt" />
          </el-radio>
        </el-radio-group>
      </template>

      <!-- 主观题 -->
      <template v-else>
        <el-input
          v-model="answers[q.number]"
          type="textarea"
          :rows="4"
          :disabled="disabled"
          placeholder="请输入你的答案..."
        />
      </template>
    </div>

    <div v-if="!disabled" class="submit-area">
      <el-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="answeredCount === 0"
        @click="handleSubmit"
      >
        提交作业
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.answer-sheet {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
}
.progress-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.question-block {
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  &.answered {
    border-color: var(--el-color-success-light-3);
    background: var(--el-color-success-light-9);
  }
}
.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  .q-num { font-weight: bold; }
  .q-score { color: var(--el-color-primary); font-size: 13px; }
}
.q-stem { font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
.options-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .option-item { padding: 4px 0; }
}
.submit-area {
  text-align: center;
  padding-top: 16px;
}
</style>
