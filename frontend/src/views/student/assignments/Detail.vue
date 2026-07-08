<script setup lang="ts">
/**
 * 学生端 — 作业详情 + 作答页
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'
import type { IAssignmentContent, ISubmissionContent } from '@/types'
import AnswerSheet from './components/AnswerSheet.vue'
import SubmissionTimer from './components/SubmissionTimer.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.id as string)
const detail = ref<any>(null)
const submitted = ref(false)
const mySubmission = ref<any>(null)
const submitting = ref(false)

onMounted(async () => {
  try {
    detail.value = await assignmentStore.fetchStudentAssignmentDetail(assignmentId.value)
    try {
      mySubmission.value = await assignmentStore.fetchMySubmission(assignmentId.value)
      if (mySubmission.value) {
        submitted.value = mySubmission.value.status !== 'returned'
      }
    } catch {
      // 尚未提交
    }
  } catch {
    router.push('/student/assignments')
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
</script>

<template>
  <div class="assignment-do-page">
    <div class="page-header">
      <el-button text @click="goBack">← 返回作业列表</el-button>
      <el-button
        v-if="submitted && mySubmission?.status === 'graded'"
        type="primary"
        size="small"
        @click="goResult"
      >
        查看批改结果
      </el-button>
    </div>

    <div v-if="!detail" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else>
      <div class="info-bar">
        <h2>{{ detail.title }}</h2>
        <div class="meta">
          <span>班级：{{ detail.class_name }}</span>
          <span>学科：{{ detail.subject }}</span>
          <span>总分：{{ detail.total_score ?? '—' }}分</span>
          <SubmissionTimer :due-date="detail.due_date" />
        </div>
      </div>

      <div v-if="isOverdue(detail.due_date) && !detail.allow_late_submission && !submitted" class="overdue-warning">
        <el-alert title="已过截止时间，该作业不允许迟交" type="error" show-icon :closable="false" />
      </div>

      <div v-if="submitted && mySubmission?.status === 'returned'" class="returned-notice">
        <el-alert title="作业已被退回，请修改后重新提交" type="warning" show-icon :closable="false" />
      </div>

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
.info-bar {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  h2 { margin: 0 0 10px; }
  .meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: var(--el-text-color-secondary); }
}
.overdue-warning, .returned-notice { margin-bottom: 16px; }
</style>
