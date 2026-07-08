<script setup lang="ts">
/**
 * 学生端 — 批改结果查看
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.id as string)

onMounted(async () => {
  try {
    await assignmentStore.fetchMySubmission(assignmentId.value)
  } catch {
    router.push('/student/assignments')
  }
})

function goBack() {
  router.push('/student/assignments')
}
</script>

<template>
  <div class="result-page">
    <div class="page-header">
      <el-button text @click="goBack">← 返回作业列表</el-button>
    </div>

    <div v-if="!assignmentStore.currentSubmission" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else>
      <div class="score-card">
        <div class="big-score">{{ assignmentStore.currentSubmission.score ?? '—' }}</div>
        <div class="score-label">总分</div>
      </div>

      <div v-if="assignmentStore.currentSubmission.ai_feedback" class="feedback-section">
        <h3>AI 批改评价</h3>
        <div class="overall">{{ assignmentStore.currentSubmission.ai_feedback.overall_comment }}</div>

        <div v-if="assignmentStore.currentSubmission.ai_feedback.step_feedback?.length" class="steps">
          <div
            v-for="(step, i) in assignmentStore.currentSubmission.ai_feedback.step_feedback"
            :key="i"
            class="step-item"
          >
            <el-icon :color="step.correct ? 'green' : 'red'" :size="18">
              <component :is="step.correct ? 'CircleCheck' : 'CircleClose'" />
            </el-icon>
            <div>
              <span class="step-name">{{ step.step }}</span>
              <span class="step-comment">{{ step.comment }}</span>
            </div>
          </div>
        </div>

        <div v-if="assignmentStore.currentSubmission.ai_feedback.error_analysis" class="error-box">
          <strong>错因分析：</strong>{{ assignmentStore.currentSubmission.ai_feedback.error_analysis }}
        </div>
      </div>

      <div v-if="assignmentStore.currentSubmission.teacher_feedback" class="teacher-section">
        <h3>教师评语</h3>
        <div class="teacher-comment">{{ assignmentStore.currentSubmission.teacher_feedback }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.result-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}
.page-header { margin-bottom: 16px; }
.loading-wrap { padding: 40px; }
.score-card {
  text-align: center;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 20px;
}
.big-score {
  font-size: 56px;
  font-weight: bold;
  color: var(--el-color-primary);
}
.score-label { font-size: 14px; color: var(--el-text-color-secondary); margin-top: 4px; }
.feedback-section, .teacher-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  h3 { margin: 0 0 12px; font-size: 16px; }
}
.overall { font-size: 15px; line-height: 1.8; }
.steps { margin-top: 12px; }
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  .step-name { font-weight: 500; margin-right: 8px; }
  .step-comment { color: var(--el-text-color-secondary); }
}
.error-box {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}
.teacher-comment {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 15px;
  line-height: 1.8;
}
</style>
