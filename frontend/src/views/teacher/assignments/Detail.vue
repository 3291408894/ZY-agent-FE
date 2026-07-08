<script setup lang="ts">
/**
 * 教师端 — 作业详情页
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
    await assignmentStore.fetchAssignmentDetail(assignmentId.value)
  } catch {
    router.push('/teacher/assignments')
  }
})

function goSubmissions() {
  router.push(`/teacher/assignments/${assignmentId.value}/submissions`)
}

function goStats() {
  router.push(`/teacher/assignments/${assignmentId.value}/stats`)
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="assignment-detail-page">
    <div class="page-header">
      <el-button text @click="router.push('/teacher/assignments')">← 返回作业列表</el-button>
    </div>

    <div v-if="assignmentStore.loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="assignmentStore.currentAssignment">
      <div class="info-section">
        <h2>{{ assignmentStore.currentAssignment.title }}</h2>
        <div class="meta-row">
          <el-tag>{{ assignmentStore.currentAssignment.subject }}</el-tag>
          <span>班级：{{ assignmentStore.currentAssignment.class_name }}</span>
          <span>总分：{{ assignmentStore.currentAssignment.total_score ?? '不设总分' }}</span>
          <span>截止：{{ formatDate(assignmentStore.currentAssignment.due_date) }}</span>
          <span>已提交：{{ assignmentStore.currentAssignment.submission_count }} 人</span>
          <span>已批改：{{ assignmentStore.currentAssignment.graded_count }} 人</span>
        </div>
        <p v-if="assignmentStore.currentAssignment.description" class="desc">
          {{ assignmentStore.currentAssignment.description }}
        </p>
      </div>

      <div class="actions">
        <el-button type="primary" @click="goSubmissions">查看提交列表</el-button>
        <el-button @click="goStats">查看统计</el-button>
      </div>

      <div class="content-preview">
        <h3>作业内容预览</h3>
        <div
          v-for="section in assignmentStore.currentAssignment.content.sections"
          :key="section.title"
          class="section-block"
        >
          <h4>{{ section.title }} <el-tag size="small" :type="section.type === 'objective' ? 'info' : 'warning'">{{ section.type === 'objective' ? '客观题' : '主观题' }}</el-tag></h4>
          <div v-for="q in section.questions" :key="q.number" class="question-item">
            <p class="q-stem"><strong>{{ q.number }}.</strong> {{ q.stem }} <span class="q-score">（{{ q.score }}分）</span></p>
            <p v-if="q.options?.length" class="q-options">
              <span v-for="(opt, i) in q.options" :key="i">{{ opt }}</span>
            </p>
            <p class="q-answer"><em>参考答案：{{ q.answer }}</em></p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.assignment-detail-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header { margin-bottom: 16px; }
.loading-wrap { padding: 40px; }
.info-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  h2 { margin: 0 0 16px; }
}
.meta-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.desc { margin-top: 12px; font-size: 14px; color: var(--el-text-color-secondary); }
.actions { margin-bottom: 16px; display: flex; gap: 8px; }
.content-preview {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
}
.section-block {
  margin-bottom: 20px;
  h4 { margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
}
.question-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  margin-bottom: 8px;
}
.q-stem { margin: 0 0 8px; .q-score { color: var(--el-color-primary); } }
.q-options { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--el-text-color-secondary); }
.q-answer { font-size: 13px; color: var(--el-color-success); margin: 4px 0 0; }
</style>
