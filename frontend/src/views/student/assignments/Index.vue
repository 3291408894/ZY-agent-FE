<script setup lang="ts">
/**
 * 学生端 — 我的作业列表
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'

const router = useRouter()
const assignmentStore = useAssignmentStore()
const activeTab = ref('pending')

onMounted(() => loadAssignments())

async function loadAssignments() {
  await assignmentStore.fetchMyAssignments({
    status: activeTab.value !== 'all' ? activeTab.value : undefined,
  })
}

function goDetail(id: string) {
  router.push(`/student/assignments/${id}`)
}

function statusTag(status: string) {
  const map: Record<string, { text: string; type: string }> = {
    pending: { text: '待完成', type: 'danger' },
    submitted: { text: '已提交', type: 'warning' },
    graded: { text: '已批改', type: 'success' },
    returned: { text: '需重做', type: 'info' },
  }
  return map[status] || { text: status, type: 'info' }
}

function isOverdue(d: string) {
  return new Date(d) < new Date()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}

function onTabChange() {
  loadAssignments()
}
</script>

<template>
  <div class="my-assignments-page">
    <h2>我的作业</h2>

    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="待完成" name="pending" />
      <el-tab-pane label="已提交" name="submitted" />
      <el-tab-pane label="已批改" name="graded" />
      <el-tab-pane label="需重做" name="returned" />
      <el-tab-pane label="全部" name="all" />
    </el-tabs>

    <div v-if="assignmentStore.loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="assignmentStore.myAssignments.length === 0" description="暂无作业" />

    <div v-else class="assignment-list">
      <div
        v-for="a in assignmentStore.myAssignments"
        :key="a.id"
        class="assignment-card"
        @click="goDetail(a.id)"
      >
        <div class="card-left">
          <h4>{{ a.title }}</h4>
          <p class="meta">
            <span>{{ a.class_name }}</span>
            <span>{{ a.subject }}</span>
            <span>截止：{{ formatDate(a.due_date) }}</span>
            <span v-if="isOverdue(a.due_date) && a.my_status === 'pending'" class="overdue">已逾期</span>
          </p>
        </div>
        <div class="card-right">
          <el-tag :type="statusTag(a.my_status).type as any" size="small">
            {{ statusTag(a.my_status).text }}
          </el-tag>
          <span v-if="a.my_score !== null && a.my_status === 'graded'" class="score">
            {{ a.my_score }} 分
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-assignments-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  h2 { margin: 0 0 16px; font-size: 20px; }
}
.loading-wrap { padding: 40px; }
.assignment-list { display: flex; flex-direction: column; gap: 12px; }
.assignment-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
    border-color: var(--el-color-primary-light-5);
  }
  &:active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
    transform: translateY(0);
  }
}
.card-left {
  h4 { margin: 0 0 6px; font-size: 15px; }
  .meta {
    display: flex; gap: 16px; font-size: 13px; color: var(--el-text-color-secondary);
    .overdue { color: var(--el-color-danger); font-weight: 500; }
  }
}
.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  .score { font-size: 18px; font-weight: bold; color: var(--el-color-primary); }
}
</style>
