<script setup lang="ts">
/**
 * 学生端 — 批改结果查看
 * 展示题目、学生答案、逐题批改反馈、总分和教师评语
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import type { IAIFeedback } from '@/types'
import MathRenderer from '@/components/common/MathRenderer.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.id as string)
const detail = ref<any>(null)
const loading = ref(true)
const error = ref(false)

/** 提取所有题目（扁平化） */
const allQuestions = computed(() => {
  const qs: Array<{
    number: number
    stem: string
    type: string
    options?: string[]
    score: number
  }> = []
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
  const submission = assignmentStore.currentSubmission
  if (submission?.content?.answers) {
    for (const a of submission.content.answers) {
      map[a.question_number] = a.answer || ''
    }
  }
  return map
})

/** 逐题批改反馈映射 */
const feedbackMap = computed<Record<number, any>>(() => {
  const map: Record<number, any> = {}
  const ai = assignmentStore.currentSubmission?.ai_feedback as IAIFeedback | null
  if (ai?.question_feedback) {
    for (const qf of ai.question_feedback) {
      map[qf.question_number] = qf
    }
  }
  return map
})

/** 每题得分率 */
function scoreRate(qNumber: number, qScore: number): number {
  const fb = feedbackMap.value[qNumber]
  if (!fb || qScore <= 0) return 0
  return Math.round((fb.score / qScore) * 100)
}

// 去除选项文本中可能带有的 "A." / "B." / "C." / "D." 前缀（防御性处理）
function stripOptionPrefix(text: string): string {
  return text.replace(/^[A-D][.)]\s*/, '')
}

/** 正确题数 */
const correctCount = computed(() => {
  return allQuestions.value.filter((q) => {
    const fb = feedbackMap.value[q.number]
    return fb && fb.score === q.score
  }).length
})

onMounted(async () => {
  try {
    const submission = await assignmentStore.fetchMySubmission(assignmentId.value)
    if (!submission) {
      router.push('/student/assignments')
      return
    }
    // 加载作业详情以获取题目内容
    detail.value = await assignmentStore.fetchStudentAssignmentDetail(assignmentId.value)
    loading.value = false
  } catch {
    error.value = true
    loading.value = false
  }
})

function goBack() {
  router.push('/student/assignments')
}
</script>

<template>
  <div class="result-page">
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
      </div>

      <!-- 作业信息 -->
      <div v-if="detail" class="info-bar">
        <h2>{{ detail.title }}</h2>
        <div class="meta">
          <span>班级：{{ detail.class_name }}</span>
          <span>学科：{{ detail.subject }}</span>
          <span>总分：{{ detail.total_score ?? '—' }}分</span>
        </div>
      </div>

      <!-- 分数卡片 -->
      <div class="score-card">
        <div class="score-main">
          <span class="big-score">{{ assignmentStore.currentSubmission?.score ?? '—' }}</span>
          <span class="score-divider">/</span>
          <span class="total-score">{{ detail?.total_score ?? '—' }}</span>
        </div>
        <div class="score-label">总分</div>
        <div class="score-stats">共 {{ allQuestions.length }} 题，答对 {{ correctCount }} 题</div>
      </div>

      <!-- 逐题详情：题目 + 学生答案 + 得分 -->
      <div class="questions-review">
        <h3>答题详情</h3>
        <div v-for="q in allQuestions" :key="q.number" class="review-item">
          <div class="q-header">
            <span class="q-num">第{{ q.number }}题</span>
            <el-tag size="small" :type="q.type === 'objective' ? 'info' : 'warning'">
              {{ q.type === 'objective' ? '客观题' : '主观题' }}
            </el-tag>
            <span class="q-score-tag">（{{ q.score }}分）</span>
            <span class="q-score-tag" v-if="feedbackMap[q.number]">
              得分：<strong
                :class="feedbackMap[q.number].score === q.score ? 'text-success' : 'text-danger'"
              >
                {{ feedbackMap[q.number].score }}
              </strong>
            </span>
          </div>

          <div class="q-stem"><MathRenderer :text="q.stem" /></div>

          <!-- 选择题：选项 + 学生选择 -->
          <div v-if="q.type === 'objective' && q.options?.length" class="q-options">
            <div
              v-for="(opt, oi) in q.options"
              :key="oi"
              class="q-option"
              :class="{ selected: answerMap[q.number] === String.fromCharCode(65 + oi) }"
            >
              <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
              <span class="opt-text"><MathRenderer :text="stripOptionPrefix(opt)" /></span>
              <el-icon
                v-if="answerMap[q.number] === String.fromCharCode(65 + oi)"
                class="opt-check"
              >
                <Check />
              </el-icon>
            </div>
          </div>

          <!-- 主观题：答案 -->
          <div v-else class="q-answer">
            <div class="answer-label">你的答案：</div>
            <div class="answer-text">
              <MathRenderer :text="answerMap[q.number] || '（未作答）'" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.result-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 16px;
}
.loading-wrap {
  padding: 40px;
}
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
  h2 {
    margin: 0 0 10px;
  }
  .meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

// ── 分数卡片 ──
.score-card {
  text-align: center;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
}
.score-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}
.big-score {
  font-size: 56px;
  font-weight: bold;
  color: var(--el-color-primary);
}
.score-divider {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
}
.total-score {
  font-size: 24px;
  color: var(--el-text-color-secondary);
}
.score-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.score-stats {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}

// ── 逐题详情 ──
.questions-review {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 16px;
    font-size: 16px;
  }

  .review-item {
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }
}
.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  .q-num {
    font-weight: bold;
    font-size: 14px;
  }
  .q-score-tag {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
.q-stem {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.q-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.q-option {
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
  .opt-text {
    flex: 1;
    font-size: 14px;
  }
  .opt-check {
    color: var(--el-color-primary);
    font-size: 16px;
  }
}
.q-answer {
  .answer-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
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

// ── 逐题反馈 ──
.q-feedback {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  &.correct {
    background: #f0f9eb;
    border: 1px solid #e1f3d8;
  }
  &.wrong {
    background: #fef0f0;
    border: 1px solid #fde2e2;
  }
  .fb-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.text-success {
  color: #67c23a;
}
.text-danger {
  color: #f56c6c;
}

// ── 评价区域 ──
.feedback-section,
.teacher-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }
}
.overall-comment {
  font-size: 15px;
  line-height: 1.8;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.teacher-comment {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.8;
}
</style>
