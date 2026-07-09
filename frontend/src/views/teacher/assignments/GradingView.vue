<script setup lang="ts">
/**
 * 教师端 — 批改页面
 * 客观题：AI自动判分（只读显示）
 * 主观题：教师逐题输入分数
 * 总分自动计算
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'
import type { IAssignmentDetail } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useAssignmentStore()

const assignmentId = computed(() => route.params.assignmentId as string)
const submissionId = computed(() => route.params.submissionId as string)

const assignment = ref<IAssignmentDetail | null>(null)
const teacherFeedback = ref('')
const submitting = ref(false)

// 教师给每道主观题的评分
const subjectiveScores = ref<Record<number, number>>({})

// 所有题目（展平）
interface QuestionInfo {
  number: number
  stem: string
  type: string
  options?: string[]
  answer: string
  maxScore: number
}
const allQuestions = computed<QuestionInfo[]>(() => {
  const qs: QuestionInfo[] = []
  for (const s of assignment.value?.content?.sections || []) {
    for (const q of s.questions) {
      qs.push({ ...q, type: s.type } as QuestionInfo)
    }
  }
  return qs
})

// AI逐题反馈
const aiFeedbackMap = computed(() => {
  const map: Record<number, any> = {}
  const fb = store.currentSubmission?.ai_feedback
  if (fb?.question_feedback) {
    for (const qf of fb.question_feedback) {
      map[qf.question_number] = qf
    }
  }
  return map
})

// 总得分 = 客观题AI分 + 主观题教师输入分
const computedTotal = computed(() => {
  let total = 0
  for (const q of allQuestions.value) {
    if (q.type === 'objective') {
      total += aiFeedbackMap.value[q.number]?.score || 0
    } else {
      total += subjectiveScores.value[q.number] || 0
    }
  }
  return total
})

const maxScore = computed(() => {
  return assignment.value?.total_score || allQuestions.value.reduce((s, q) => s + q.maxScore, 0)
})

// 学生答案
const studentAnswers = computed(() => {
  const map: Record<number, string> = {}
  for (const a of store.currentSubmission?.content?.answers || []) {
    map[a.question_number] = a.answer || ''
  }
  return map
})

onMounted(async () => {
  try {
    assignment.value = await store.fetchAssignmentDetail(assignmentId.value)
    await store.fetchSubmissionDetail(assignmentId.value, submissionId.value)
    // 初始化主观题分数（使用AI建议值或0）
    for (const q of allQuestions.value) {
      if (q.type === 'subjective') {
        const aiScore = aiFeedbackMap.value[q.number]?.suggested_score ?? aiFeedbackMap.value[q.number]?.score ?? 0
        subjectiveScores.value[q.number] = aiScore
      }
    }
  } catch {
    router.push(`/teacher/assignments/${assignmentId.value}/submissions`)
  }
})

function goBack() {
  router.push(`/teacher/assignments/${assignmentId.value}/submissions`)
}

// 确认AI批改（客观题AI+主观题AI建议，一键发布）
async function handleConfirmAI() {
  submitting.value = true
  try {
    await store.gradeAction(assignmentId.value, submissionId.value, {
      confirm_ai_feedback: true,
      teacher_feedback: teacherFeedback.value || undefined,
    })
    ElMessage.success('已发布，学生可见')
    goBack()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 手动逐题评分发布
async function handleManualGrade() {
  const scores = allQuestions.value.map((q) => ({
    question_number: q.number,
    score: q.type === 'objective'
      ? (aiFeedbackMap.value[q.number]?.score || 0)
      : (subjectiveScores.value[q.number] || 0),
  }))
  submitting.value = true
  try {
    await store.gradeAction(assignmentId.value, submissionId.value, {
      scores,
      teacher_feedback: teacherFeedback.value || undefined,
    })
    ElMessage.success('批改已发布，学生可见')
    goBack()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

function hasAI() {
  return !!store.currentSubmission?.ai_feedback
}
</script>

<template>
  <div class="grading-page">
    <div class="page-header">
      <el-button text @click="goBack">← 返回</el-button>
      <div>
        总分：<strong class="total-score">{{ computedTotal }}</strong> / {{ maxScore }} 分
      </div>
    </div>

    <div v-if="!assignment || store.loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else>
      <!-- 逐题评分列表 -->
      <div v-for="q in allQuestions" :key="q.number" class="q-row">
        <div class="q-left">
          <div class="q-header">
            <strong class="q-num">{{ q.number }}.</strong>
            <el-tag size="small" :type="q.type === 'objective' ? '' : 'warning'">
              {{ q.type === 'objective' ? '客观' : '主观' }} {{ q.maxScore }}分
            </el-tag>
          </div>
          <div class="q-stem">{{ q.stem }}</div>
          <div v-if="q.options?.length" class="q-opts">
            {{ q.options.join('  |  ') }}
          </div>
          <div class="q-ref">✅ 答案：{{ q.answer }}</div>
        </div>

        <div class="q-mid">
          <div class="student-label">学生作答：</div>
          <div class="student-ans">{{ studentAnswers[q.number] || '(未作答)' }}</div>
        </div>

        <div class="q-right">
          <!-- 客观题：显示AI自动判分（不可编辑） -->
          <template v-if="q.type === 'objective'">
            <div class="auto-score" :class="(aiFeedbackMap[q.number]?.score || 0) > 0 ? 'correct' : 'wrong'">
              <span class="icon">{{ (aiFeedbackMap[q.number]?.score || 0) > 0 ? '✓' : '✗' }}</span>
              <span class="val">{{ aiFeedbackMap[q.number]?.score || 0 }} / {{ q.maxScore }}</span>
            </div>
            <div v-if="aiFeedbackMap[q.number]?.overall_comment" class="ai-comment">
              {{ aiFeedbackMap[q.number]?.overall_comment }}
            </div>
          </template>

          <!-- 主观题：教师手动输入分数 -->
          <template v-else>
            <div class="manual-score">
              <el-input-number
                v-model="subjectiveScores[q.number]"
                :min="0"
                :max="q.maxScore"
                :step="1"
                size="small"
                style="width: 100px"
                @change="() => {}"
              />
              <span class="unit">/ {{ q.maxScore }} 分</span>
            </div>
            <div v-if="aiFeedbackMap[q.number]?.overall_comment" class="ai-hint">
              AI建议：{{ aiFeedbackMap[q.number]?.score }}分 — {{ aiFeedbackMap[q.number]?.overall_comment }}
            </div>
          </template>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-bar">
        <el-input
          v-model="teacherFeedback"
          type="textarea"
          :rows="2"
          placeholder="给学生写总评（可选）"
          style="margin-bottom: 12px"
        />
        <div class="btn-group">
          <el-button
            v-if="hasAI()"
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleConfirmAI"
          >
            确认AI批改并发布（{{ computedTotal }}/{{ maxScore }}分）
          </el-button>
          <el-button
            size="large"
            :loading="submitting"
            @click="handleManualGrade"
          >
            {{ hasAI() ? '修改后发布' : '发布评分' }}（{{ computedTotal }}/{{ maxScore }}分）
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.grading-page {
  padding: 16px;
  max-width: 1100px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  .total-score { font-size: 22px; color: var(--el-color-primary); }
}
.loading-wrap { padding: 40px; }

.q-row {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  align-items: flex-start;
}
.q-left {
  flex: 2;
  min-width: 0;
}
.q-mid {
  flex: 1.5;
  min-width: 0;
}
.q-right {
  flex: 1;
  min-width: 160px;
  text-align: center;
}

.q-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  .q-num { font-size: 14px; }
}
.q-stem { font-size: 14px; line-height: 1.5; margin-bottom: 4px; }
.q-opts { font-size: 12px; color: var(--el-text-color-secondary); }
.q-ref { font-size: 12px; color: var(--el-color-success); margin-top: 4px; font-weight: 500; }

.student-label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 2px; }
.student-ans {
  padding: 8px 10px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  line-height: 1.5;
  min-height: 32px;
}

.auto-score {
  font-size: 20px;
  font-weight: bold;
  padding: 8px;
  border-radius: 6px;
  &.correct { color: var(--el-color-success); background: var(--el-color-success-light-9); }
  &.wrong { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
  .icon { margin-right: 4px; }
}
.ai-comment { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }

.manual-score {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  .unit { font-size: 13px; color: var(--el-text-color-secondary); }
}
.ai-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
  background: #fff8e1;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1.4;
}

.bottom-bar {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
}
.btn-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
