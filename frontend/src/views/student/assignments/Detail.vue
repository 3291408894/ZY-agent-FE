<script setup lang="ts">
/**
 * 学生端 — 作业详情 + 作答页
 *
 * 按提交状态分流：
 * - 未提交 → 显示答题卡
 * - 已提交/批改中 → 显示只读答案 + 状态提示
 * - 已批改 → 自动跳转到结果页
 * - 已退回 → 显示答题卡（可重新作答）
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'
import type { IAssignmentContent, ISubmissionContent } from '@/types'
import AnswerSheet from './components/AnswerSheet.vue'
import SubmissionTimer from './components/SubmissionTimer.vue'
import MathRenderer from '@/components/common/MathRenderer.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.id as string)
const detail = ref<any>(null)
const submitted = ref(false)
const mySubmission = ref<any>(null)
const submitting = ref(false)
const loading = ref(true)
const error = ref(false)

/** 提取所有题目（扁平化） */
const allQuestions = computed(() => {
  const qs: Array<{ number: number; stem: string; type: string; options?: string[]; score: number }> = []
  if (!detail.value?.content?.sections) return qs
  for (const section of detail.value.content.sections) {
    for (const q of section.questions) {
      qs.push({ ...q, type: section.type })
    }
  }
  return qs
})

/** 学生答案映射 */
const answerMap = computed<Record<number, string>>(() => {
  const map: Record<number, string> = {}
  if (mySubmission.value?.content?.answers) {
    for (const a of mySubmission.value.content.answers) {
      map[a.question_number] = a.answer || ''
    }
  }
  return map
})

onMounted(async () => {
  try {
    detail.value = await assignmentStore.fetchStudentAssignmentDetail(assignmentId.value)
    mySubmission.value = await assignmentStore.fetchMySubmission(assignmentId.value)
    if (mySubmission.value) {
      submitted.value = mySubmission.value.status !== 'returned'
      // 已批改 → 直接跳转到结果页
      if (mySubmission.value.status === 'graded') {
        router.replace(`/student/assignments/${assignmentId.value}/result`)
        return
      }
    }
    loading.value = false
  } catch {
    error.value = true
    loading.value = false
  }
})

function goBack() {
  router.push('/student/assignments')
}

function goResult() {
  router.push(`/student/assignments/${assignmentId.value}/result`)
}

async function handleSubmit(answers: { question_number: number; answer: string }[]) {
  submitting.value = true
  try {
    await assignmentStore.submitAction(assignmentId.value, { answers })
    ElMessage.success('作业提交成功！')
    submitted.value = true
    mySubmission.value = await assignmentStore.fetchMySubmission(assignmentId.value)
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function isOverdue(d: string) {
  return new Date(d) < new Date()
}

const submissionStatusText: Record<string, string> = {
  submitted: '作业已提交，等待教师批改',
  grading: 'AI 正在批改中，请稍后查看结果',
  returned: '作业已被退回，请修改后重新提交',
}
</script>

<template>
  <div class="assignment-do-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="error-state">
      <p>加载失败，请返回重试</p>
      <el-button type="primary" size="small" @click="goBack">返回作业列表</el-button>
    </div>

    <template v-else>
      <!-- 顶部导航 -->
      <div class="page-header">
        <el-button text @click="goBack">← 返回作业列表</el-button>
        <el-button
          v-if="submitted && mySubmission?.status === 'submitted'"
          type="primary"
          size="small"
          @click="goResult"
        >
          查看批改结果
        </el-button>
      </div>

      <!-- 作业信息 -->
      <div class="info-bar">
        <h2>{{ detail.title }}</h2>
        <div class="meta">
          <span>班级：{{ detail.class_name }}</span>
          <span>学科：{{ detail.subject }}</span>
          <span>总分：{{ detail.total_score ?? '—' }}分</span>
          <SubmissionTimer :due-date="detail.due_date" />
        </div>
      </div>

      <!-- 已逾期且未提交 -->
      <div v-if="isOverdue(detail.due_date) && !detail.allow_late_submission && !submitted" class="overdue-warning">
        <el-alert title="已过截止时间，该作业不允许迟交" type="error" show-icon :closable="false" />
      </div>

      <!-- 已退回 -->
      <div v-if="submitted && mySubmission?.status === 'returned'" class="returned-notice">
        <el-alert title="作业已被退回，请修改后重新提交" type="warning" show-icon :closable="false" />
      </div>

      <!-- 已提交 / 批改中 → 显示只读答案 -->
      <div
        v-if="submitted && mySubmission?.status !== 'returned' && mySubmission?.status !== 'graded'"
        class="submitted-view"
      >
        <el-alert
          :title="submissionStatusText[mySubmission?.status] || '已提交'"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />
        <div
          v-for="q in allQuestions"
          :key="q.number"
          class="readonly-question"
        >
          <div class="q-header">
            <span class="q-num">第{{ q.number }}题</span>
            <el-tag size="small" :type="q.type === 'objective' ? 'info' : 'warning'">
              {{ q.type === 'objective' ? '客观题' : '主观题' }}
            </el-tag>
            <span class="q-score">（{{ q.score }}分）</span>
          </div>
          <div class="q-stem"><MathRenderer :text="q.stem" /></div>

          <!-- 选择题：显示选项 + 已选答案 -->
          <div v-if="q.type === 'objective' && q.options?.length" class="readonly-options">
            <div
              v-for="(opt, oi) in q.options"
              :key="oi"
              class="readonly-option"
              :class="{ selected: answerMap[q.number] === String.fromCharCode(65 + oi) }"
            >
              <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
              <span class="opt-text"><MathRenderer :text="opt" /></span>
              <el-icon v-if="answerMap[q.number] === String.fromCharCode(65 + oi)" class="opt-check">
                <Check />
              </el-icon>
            </div>
          </div>

          <!-- 主观题：显示答案文本 -->
          <div v-else class="readonly-answer">
            <div class="answer-label">你的答案：</div>
            <div class="answer-text"><MathRenderer :text="answerMap[q.number] || '（未作答）'" /></div>
          </div>
        </div>
      </div>

      <!-- 未提交 / 已退回 → 显示答题卡 -->
      <AnswerSheet
        v-if="!submitted || mySubmission?.status === 'returned'"
        :content="detail.content"
        :disabled="isOverdue(detail.due_date) && !detail.allow_late_submission"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.assignment-do-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.loading-wrap { padding: 40px; }
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--el-text-color-secondary);
}
.info-bar {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  h2 { margin: 0 0 10px; }
  .meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: var(--el-text-color-secondary); }
}
.overdue-warning, .returned-notice { margin-bottom: 16px; }

// ── 只读答案视图 ──
.submitted-view {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
}
.readonly-question {
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  .q-num { font-weight: bold; font-size: 14px; }
  .q-score { color: var(--el-color-primary); font-size: 13px; }
}
.q-stem { font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
.readonly-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.readonly-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  .opt-letter {
    font-weight: bold;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--el-fill-color);
    font-size: 13px;
  }
  .selected & .opt-letter {
    background: var(--el-color-primary);
    color: #fff;
  }
  .opt-text { flex: 1; font-size: 14px; }
  .opt-check { color: var(--el-color-primary); font-size: 16px; }
}
.readonly-answer {
  .answer-label { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
  .answer-text {
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style>
