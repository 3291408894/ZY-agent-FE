<script setup lang="ts">
/**
 * 教师端 — 班级列表页
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '@/stores/class'
import ClassCreateDialog from './components/ClassCreateDialog.vue'
import InviteCodePanel from './components/InviteCodePanel.vue'

const router = useRouter()
const classStore = useClassStore()

const showCreateDialog = ref(false)
const showInvitePanel = ref(false)
const selectedClassId = ref('')
const selectedClassName = ref('')

onMounted(() => {
  classStore.fetchTeacherClasses()
})

function goDetail(id: string) {
  router.push(`/teacher/classes/${id}`)
}

function handleCreated() {
  showCreateDialog.value = false
  classStore.fetchTeacherClasses()
}

async function handleArchive(id: string) {
  try {
    await ElMessageBox.confirm('归档后该班级不可新增作业，确定归档吗？', '确认归档', { type: 'warning' })
    await classStore.archiveClassAction(id)
    ElMessage.success('班级已归档')
  } catch {}
}

function showInvite(id: string, name: string) {
  selectedClassId.value = id
  selectedClassName.value = name
  showInvitePanel.value = true
}
</script>

<template>
  <div class="class-list-page">
    <div class="page-header">
      <h2>班级管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">创建班级</el-button>
    </div>

    <div v-if="classStore.loading" class="loading-wrap">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty v-else-if="classStore.teacherClasses.length === 0" description="还没有班级，点击上方按钮创建第一个班级" />

    <div v-else class="class-grid">
      <div
        v-for="cls in classStore.teacherClasses"
        :key="cls.id"
        class="class-card"
        @click="goDetail(cls.id)"
      >
        <div class="card-header">
          <h3>{{ cls.name }}</h3>
          <el-tag :type="cls.status === 'active' ? 'success' : 'info'" size="small">
            {{ cls.status === 'active' ? '进行中' : '已归档' }}
          </el-tag>
        </div>
        <div class="card-body">
          <p><span>学科：</span>{{ cls.subject }}</p>
          <p><span>年级：</span>{{ cls.grade }}</p>
          <p><span>学生人数：</span>{{ cls.student_count }} 人</p>
        </div>
        <div class="card-footer">
          <el-button text type="primary" @click.stop="showInvite(cls.id, cls.name)">邀请码</el-button>
          <el-button
            v-if="cls.status === 'active'"
            text
            type="warning"
            @click.stop="handleArchive(cls.id)"
          >归档</el-button>
        </div>
      </div>
    </div>

    <ClassCreateDialog v-model:visible="showCreateDialog" @created="handleCreated" />
    <InviteCodePanel
      v-model:visible="showInvitePanel"
      :class-id="selectedClassId"
      :class-name="selectedClassName"
    />
  </div>
</template>

<style scoped lang="scss">
.class-list-page {
  padding: 24px;
  max-width: 1200px;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.class-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  h3 { margin: 0; font-size: 16px; }
}
.card-body p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  span { color: var(--el-text-color-regular); font-weight: 500; }
}
.card-footer {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
