<script setup lang="ts">
/**
 * 学生端 — 我的班级列表
 */
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '@/stores/class'
import JoinClassDialog from './components/JoinClassDialog.vue'

const classStore = useClassStore()
const showJoinDialog = ref(false)

onMounted(() => {
  classStore.fetchStudentClasses()
})

async function handleLeave(classId: string, className: string) {
  try {
    await ElMessageBox.confirm(`确定要退出「${className}」吗？`, '确认退出', { type: 'warning' })
    await classStore.leaveClassAction(classId)
    ElMessage.success('已退出班级')
  } catch {}
}

function handleJoined() {
  showJoinDialog.value = false
  classStore.fetchStudentClasses()
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="my-classes-page">
    <div class="page-header">
      <h2>我的班级</h2>
      <el-button type="primary" @click="showJoinDialog = true">加入班级</el-button>
    </div>

    <div v-if="classStore.loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="classStore.studentClasses.length === 0" description="还没有加入任何班级，点击上方按钮通过邀请码加入" />

    <div v-else class="class-grid">
      <div v-for="cls in classStore.studentClasses" :key="cls.id" class="class-card">
        <div class="card-header">
          <h3>{{ cls.name }}</h3>
        </div>
        <div class="card-body">
          <p><span>教师：</span>{{ cls.teacher_name }}</p>
          <p><span>学科：</span>{{ cls.subject }}</p>
          <p><span>年级：</span>{{ cls.grade }}</p>
          <p><span>加入时间：</span>{{ formatDate(cls.joined_at) }}</p>
        </div>
        <div class="card-footer">
          <el-button text type="danger" size="small" @click="handleLeave(cls.id, cls.name)">退出班级</el-button>
        </div>
      </div>
    </div>

    <JoinClassDialog v-model:visible="showJoinDialog" @joined="handleJoined" />
  </div>
</template>

<style scoped lang="scss">
.my-classes-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 20px; }
}
.loading-wrap { padding: 40px; }
.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.class-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
}
.card-header h3 { margin: 0 0 12px; font-size: 16px; }
.card-body p {
  margin: 4px 0; font-size: 14px; color: var(--el-text-color-secondary);
  span { color: var(--el-text-color-regular); font-weight: 500; }
}
.card-footer { margin-top: 12px; }
</style>
