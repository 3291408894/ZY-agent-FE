<script setup lang="ts">
// ================================================================
// 教师端 — 班级详情页
// 班级信息 + 邀请码面板 + 花名册 + 归档操作
// ================================================================

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '@/stores/class'
import InviteCodePanel from './components/InviteCodePanel.vue'
import StudentRoster from './components/StudentRoster.vue'

const route = useRoute()
const router = useRouter()
const classStore = useClassStore()

const classId = computed(() => route.params.classId as string)
const loading = ref(true)
const error = ref(false)

const isArchived = computed(() => classStore.currentClass?.status === 'archived')

async function loadDetail() {
  error.value = false
  loading.value = true
  try {
    await classStore.fetchClassDetail(classId.value)
    await classStore.fetchRoster(classId.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function handleRemoveStudent(studentId: string, studentName: string) {
  try {
    await classStore.removeStudent(classId.value, studentId)
    ElMessage.success(`已将「${studentName}」移出班级`)
  } catch {
    // 错误已在拦截器中处理
  }
}

async function handleRegenerateCode() {
  try {
    const newCode = await classStore.regenerateCode(classId.value)
    ElMessage.success(`邀请码已重新生成：${newCode}`)
  } catch {
    // 错误已在拦截器中处理
  }
}

async function handleArchive() {
  try {
    await ElMessageBox.confirm(
      '归档后该班级将无法新增作业，但历史数据仍可查看。确定归档？',
      '确认归档班级',
      {
        confirmButtonText: '确定归档',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    await classStore.archiveClass(classId.value)
    ElMessage.success('班级已归档')
  } catch {
    // 错误已在拦截器中处理
  }
}

function goBack() {
  router.push({ name: 'TeacherClasses' })
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="class-detail">
    <!-- 返回按钮 -->
    <div class="back-row">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回班级列表
      </el-button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state" v-loading="true" />

    <!-- 加载失败 -->
    <div v-else-if="error" class="error-state card">
      <el-icon :size="48" style="color: var(--color-info)">
        <WarningFilled />
      </el-icon>
      <p>数据加载失败，请检查网络后刷新重试</p>
      <el-button type="primary" @click="loadDetail">重新加载</el-button>
    </div>

    <!-- 班级详情内容 -->
    <div v-else-if="classStore.currentClass">
      <!-- 班级基本信息 -->
      <div class="class-info card">
        <div class="class-info__header">
          <div class="class-info__title-row">
            <div class="class-info__icon">
              <el-icon :size="28"><School /></el-icon>
            </div>
            <div>
              <h2 class="class-info__name">
                {{ classStore.currentClass.name }}
              </h2>
              <div class="class-info__meta">
                <span>{{ classStore.currentClass.grade }}</span>
                <span class="meta-dot">·</span>
                <span>{{ classStore.currentClass.subject }}</span>
                <span class="meta-dot">·</span>
                <span>
                  <el-icon :size="14"><User /></el-icon>
                  {{ classStore.currentClass.student_count }} 人
                </span>
              </div>
            </div>
          </div>
          <div class="class-info__actions">
            <el-tag
              :type="isArchived ? 'info' : 'success'"
              size="large"
            >
              {{ isArchived ? '已归档' : '进行中' }}
            </el-tag>
            <el-button
              v-if="!isArchived"
              type="warning"
              plain
              @click="handleArchive"
            >
              归档班级
            </el-button>
          </div>
        </div>

        <p
          v-if="classStore.currentClass.description"
          class="class-info__desc"
        >
          {{ classStore.currentClass.description }}
        </p>
      </div>

      <!-- 邀请码面板 -->
      <InviteCodePanel
        :invite-code="classStore.currentClass.invite_code"
        :class-id="classId"
        :archived="isArchived"
        @regenerate="handleRegenerateCode"
        style="margin-top: var(--spacing-lg)"
      />

      <!-- 花名册 -->
      <div class="roster-section" style="margin-top: var(--spacing-xl)">
        <StudentRoster
          :students="classStore.roster"
          :loading="classStore.rosterLoading"
          :archived="isArchived"
          @remove="handleRemoveStudent"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.class-detail {
  max-width: 960px;
  margin: 0 auto;
}

.back-row {
  margin-bottom: var(--spacing-lg);
}

.loading-state {
  min-height: 300px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xxl);
  min-height: 300px;
  gap: var(--spacing-md);

  p {
    color: var(--color-text-secondary);
    margin: 0;
  }
}

// ── 班级信息卡片 ──
.class-info {
  padding: var(--spacing-xl);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-base);
    flex-wrap: wrap;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-md);
    background: var(--color-primary-lighter);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__name {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-xs);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);

    .meta-dot {
      margin: 0 2px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__desc {
    margin: var(--spacing-lg) 0 0;
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border-light);
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-base);
  }
}

@media (max-width: 768px) {
  .class-info {
    &__header {
      flex-direction: column;
    }

    &__title-row {
      flex-direction: column;
      align-items: flex-start;
    }

    &__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
