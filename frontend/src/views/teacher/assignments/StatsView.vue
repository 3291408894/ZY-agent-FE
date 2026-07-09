<script setup lang="ts">
/**
 * 教师端 — 作业统计仪表盘
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = computed(() => route.params.assignmentId as string)

onMounted(async () => {
  try {
    await assignmentStore.fetchStats(assignmentId.value)
  } catch {
    router.push('/teacher/assignments')
  }
})

const distEntries = computed(() => {
  if (!assignmentStore.stats) return []
  return Object.entries(assignmentStore.stats.score_distribution)
})
</script>

<template>
  <div class="stats-page">
    <div class="page-header">
      <el-button text @click="router.push('/teacher/assignments')">← 返回作业列表</el-button>
    </div>

    <div v-if="assignmentStore.loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="assignmentStore.stats">
      <h2>作业统计</h2>

      <el-row :gutter="16" class="stat-cards">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ assignmentStore.stats.submitted_count }} / {{ assignmentStore.stats.total_students }}</div>
            <div class="stat-label">已提交 / 总人数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value success">{{ assignmentStore.stats.completion_rate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value primary">{{ assignmentStore.stats.graded_count }}</div>
            <div class="stat-label">已批改人数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value warning">{{ assignmentStore.stats.average_score ?? '-' }}</div>
            <div class="stat-label">平均分</div>
          </div>
        </el-col>
      </el-row>

      <div class="dist-section">
        <h3>分数分布</h3>
        <el-row :gutter="8">
          <el-col v-for="(entry, i) in distEntries" :key="i" :span="4">
            <div class="dist-bar">
              <div class="dist-label">{{ entry[0] }}</div>
              <div class="dist-count">{{ entry[1] }} 人</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="question-section">
        <h3>各题正确率</h3>
        <el-table :data="assignmentStore.stats.question_stats" stripe size="small">
          <el-table-column prop="question_number" label="题号" width="70" />
          <el-table-column prop="stem" label="题目" min-width="200" />
          <el-table-column prop="max_score" label="分值" width="70" />
          <el-table-column label="题型" width="80">
            <template #default="{ row }">{{ row.type === 'objective' ? '客观' : '主观' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.stats-page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  h2 { margin: 0 0 20px; font-size: 20px; }
}
.page-header { margin-bottom: 16px; }
.loading-wrap { padding: 40px; }
.stat-cards { margin-bottom: 24px; }
.stat-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  &.success { color: var(--el-color-success); }
  &.primary { color: var(--el-color-primary); }
  &.warning { color: var(--el-color-warning); }
}
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 4px; }
.dist-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  h3 { margin: 0 0 12px; }
}
.dist-bar {
  text-align: center;
  padding: 12px 0;
}
.dist-label { font-size: 13px; color: var(--el-text-color-secondary); }
.dist-count { font-size: 20px; font-weight: bold; }
.question-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  h3 { margin: 0 0 12px; }
}
</style>
