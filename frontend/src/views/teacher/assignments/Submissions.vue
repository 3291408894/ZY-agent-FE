<script setup lang="ts">
/**
 * 教师端 — 提交列表页
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.assignmentId as string)
const filterStatus = ref('')

onMounted(() => loadSubmissions())

async function loadSubmissions() {
  try {
    await assignmentStore.fetchSubmissions(assignmentId.value, {
      status: filterStatus.value || undefined,
    })
  } catch {
    router.push('/teacher/assignments')
  }
}

function goGrading(submissionId: string) {
  router.push(`/teacher/assignments/${assignmentId.value}/submissions/${submissionId}`)
}

async function handleBatchGrade() {
  try {
    await assignmentStore.batchGradeAction(assignmentId.value)
    ElMessage.success(
      `AI 批改完成：成功 ${assignmentStore.batchGradingResult?.success}，失败 ${assignmentStore.batchGradingResult?.failed}`
    )
    await loadSubmissions()
  } catch {
    ElMessage.error('批量批改失败')
  }
}

async function handleReturn(submissionId: string) {
  try {
    await assignmentStore.returnSubmissionAction(assignmentId.value, submissionId)
    ElMessage.success('已退回')
    await loadSubmissions()
  } catch {
    ElMessage.error('操作失败')
  }
}

function statusText(status: string) {
  const map: Record<string, string> = { submitted: '已提交', grading: 'AI已批', graded: '已批改', returned: '已退回' }
  return map[status] || status
}

function statusType(status: string) {
  const map: Record<string, string> = { submitted: 'warning', grading: 'info', graded: 'success', returned: 'danger' }
  return map[status] || 'info'
}

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleString('zh-CN') : '-'
}
</script>

<template>
  <div class="submissions-page">
    <div class="page-header">
      <el-button text @click="router.push('/teacher/assignments')">← 返回作业列表</el-button>
      <el-button
        v-if="assignmentStore.submissions.some(s => s.status === 'submitted')"
        type="primary"
        @click="handleBatchGrade"
      >
        一键AI批改
      </el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 160px" @change="loadSubmissions">
        <el-option label="已提交" value="submitted" />
        <el-option label="AI已批" value="grading" />
        <el-option label="已批改" value="graded" />
        <el-option label="已退回" value="returned" />
      </el-select>
    </div>

    <el-table :data="assignmentStore.submissions" stripe style="width: 100%">
      <el-table-column prop="student_nickname" label="学生" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="得分" width="80">
        <template #default="{ row }">{{ row.score ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="提交时间" min-width="170">
        <template #default="{ row }">{{ formatDate(row.submitted_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="goGrading(row.id)">批改</el-button>
          <el-button
            v-if="row.status === 'submitted' || row.status === 'grading'"
            text
            type="warning"
            size="small"
            @click="handleReturn(row.id)"
          >退回</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.submissions-page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.filter-bar { margin-bottom: 16px; }
</style>
