<script setup lang="ts">
/**
 * 教师端 — 班级详情页
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '@/stores/class'
import InviteCodePanel from './components/InviteCodePanel.vue'

const route = useRoute()
const router = useRouter()
const classStore = useClassStore()

const classId = computed(() => route.params.id as string)
const showInvitePanel = ref(false)

onMounted(async () => {
  try {
    await classStore.fetchClassDetail(classId.value)
  } catch {
    ElMessage.error('班级不存在')
    router.push('/teacher/classes')
  }
})

function goBack() {
  router.push('/teacher/classes')
}

async function handleRemoveStudent(studentId: string, studentName: string) {
  try {
    await ElMessageBox.confirm(`确定要将 ${studentName} 移出班级吗？`, '确认移除', { type: 'warning' })
    await classStore.removeStudentFromClass(classId.value, studentId)
    ElMessage.success(`已移除 ${studentName}`)
  } catch {}
}

async function handleRegenerateCode() {
  try {
    await ElMessageBox.confirm('重新生成后旧邀请码将立即失效，确定吗？', '确认重新生成', { type: 'warning' })
    await classStore.regenerateCode(classId.value)
    ElMessage.success('邀请码已重新生成')
  } catch {}
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="class-detail-page">
    <div class="page-header">
      <el-button text @click="goBack">← 返回班级列表</el-button>
    </div>

    <div v-if="classStore.loading" class="loading-wrap">
      <el-skeleton :rows="8" animated />
    </div>

    <template v-else-if="classStore.currentClass">
      <div class="info-section">
        <h2>{{ classStore.currentClass.name }}</h2>
        <div class="info-row">
          <span class="label">学科：</span><span>{{ classStore.currentClass.subject }}</span>
          <span class="label">年级：</span><span>{{ classStore.currentClass.grade }}</span>
          <span class="label">学生人数：</span><span>{{ classStore.currentClass.student_count }}</span>
          <span class="label">状态：</span>
          <el-tag :type="classStore.currentClass.status === 'active' ? 'success' : 'info'" size="small">
            {{ classStore.currentClass.status === 'active' ? '进行中' : '已归档' }}
          </el-tag>
        </div>
        <p v-if="classStore.currentClass.description" class="desc">
          {{ classStore.currentClass.description }}
        </p>
      </div>

      <div class="invite-section">
        <h3>邀请码</h3>
        <div class="invite-code-display">
          <span class="code">{{ classStore.currentClass.invite_code }}</span>
          <el-button size="small" @click="showInvitePanel = true">查看/复制</el-button>
          <el-button size="small" type="warning" @click="handleRegenerateCode">重新生成</el-button>
        </div>
      </div>

      <div class="roster-section">
        <h3>花名册（{{ classStore.currentClass.student_count }} 人）</h3>
        <el-table :data="classStore.currentClass.students" stripe style="width: 100%">
          <el-table-column prop="nickname" label="学生姓名" min-width="120" />
          <el-table-column label="加入时间" min-width="180">
            <template #default="{ row }">{{ formatDate(row.joined_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button text type="danger" size="small" @click="handleRemoveStudent(row.student_id, row.nickname)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <InviteCodePanel
      v-model:visible="showInvitePanel"
      :class-id="classId"
      :class-name="classStore.currentClass?.name || ''"
    />
  </div>
</template>

<style scoped lang="scss">
.class-detail-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}
.page-header { margin-bottom: 16px; }
.loading-wrap { padding: 40px; }
.info-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  h2 { margin: 0 0 16px; font-size: 20px; }
}
.info-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 14px;
  .label { color: var(--el-text-color-secondary); }
}
.desc { margin-top: 12px; color: var(--el-text-color-secondary); font-size: 14px; }
.invite-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  h3 { margin: 0 0 12px; font-size: 16px; }
}
.invite-code-display {
  display: flex;
  align-items: center;
  gap: 12px;
  .code { font-size: 24px; font-weight: bold; letter-spacing: 4px; font-family: monospace; color: var(--el-color-primary); }
}
.roster-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 24px;
  h3 { margin: 0 0 12px; font-size: 16px; }
}
</style>
