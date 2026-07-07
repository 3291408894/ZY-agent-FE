<script setup lang="ts">
/**
 * 教师端 — 作业列表页
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'
import { useClassStore } from '@/stores/class'
import AssignmentForm from './components/AssignmentForm.vue'

const router = useRouter()
const assignmentStore = useAssignmentStore()
const classStore = useClassStore()

const showForm = ref(false)
const filterClassId = ref('')
const filterStatus = ref('')

onMounted(() => {
  assignmentStore.fetchTeacherAssignments()
  classStore.fetchTeacherClasses()
})

async function loadAssignments() {
  await assignmentStore.fetchTeacherAssignments({
    class_id: filterClassId.value || undefined,
    status: filterStatus.value || undefined,
  })
}

function goDetail(id: string) {
  router.push(`/teacher/assignments/${id}`)
}

function goStats(id: string) {
  router.push(`/teacher/assignments/${id}/stats`)
}

function goSubmissions(id: string) {
  router.push(`/teacher/assignments/${id}/submissions`)
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该作业吗？（仅无提交记录的作业可删除）', '确认删除', { type: 'warning' })
    await assignmentStore.removeAssignment(id)
    ElMessage.success('已删除')
  } catch {}
}

function isOverdue(d: string) {
  return new Date(d) < new Date()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="assignment-list-page">
    <div class="page-header">
      <h2>作业管理</h2>
      <el-button type="primary" @click="showForm = true">布置作业</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filterClassId" placeholder="按班级" clearable style="width: 200px" @change="loadAssignments">
        <el-option
          v-for="c in classStore.activeClasses"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>
      <el-select v-model="filterStatus" placeholder="按状态" clearable style="width: 140px" @change="loadAssignments">
        <el-option label="进行中" value="active" />
        <el-option label="已截止" value="closed" />
      </el-select>
    </div>

    <div v-if="assignmentStore.loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="assignmentStore.assignments.length === 0" description="还没有作业，点击上方按钮布置" />

    <el-table v-else :data="assignmentStore.assignments" stripe style="width: 100%">
      <el-table-column prop="title" label="作业标题" min-width="180">
        <template #default="{ row }">
          <el-button text type="primary" @click="goDetail(row.id)">{{ row.title }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="class_name" label="班级" width="160" />
      <el-table-column prop="subject" label="学科" width="80" />
      <el-table-column label="提交进度" width="120">
        <template #default="{ row }">{{ row.submission_count }} / {{ row.graded_count }} 批</template>
      </el-table-column>
      <el-table-column label="截止时间" width="170">
        <template #default="{ row }">
          <span :class="{ overdue: isOverdue(row.due_date) }">
            {{ formatDate(row.due_date) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="goSubmissions(row.id)">查看提交</el-button>
          <el-button text size="small" @click="goStats(row.id)">统计</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <AssignmentForm v-model:visible="showForm" @created="loadAssignments" />
  </div>
</template>

<style scoped lang="scss">
.assignment-list-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 20px; }
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.loading-wrap { padding: 40px; }
.overdue { color: var(--el-color-danger); }
</style>
