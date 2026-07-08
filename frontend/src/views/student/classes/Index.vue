<script setup lang="ts">
// ================================================================
// 学生端 — 我的班级列表页
// 展示已加入的班级，支持加入新班级和退出班级
// ================================================================

import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '@/stores/class'
import JoinClassDialog from './components/JoinClassDialog.vue'
import ClassResourceList from './components/ClassResourceList.vue'

const classStore = useClassStore()
const joinDialog = ref<InstanceType<typeof JoinClassDialog>>()

const loading = ref(true)
const error = ref(false)
const expandedClassId = ref<string | null>(null)

async function loadClasses() {
  error.value = false
  loading.value = true
  try {
    await classStore.fetchStudentClasses()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function toggleResources(classId: string) {
  expandedClassId.value = expandedClassId.value === classId ? null : classId
}

async function handleLeave(classId: string, className: string) {
  try {
    await ElMessageBox.confirm(
      `确定要退出「${className}」吗？退出后需重新通过邀请码加入。`,
      '确认退出班级',
      {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    await classStore.leaveClass(classId)
    if (expandedClassId.value === classId) expandedClassId.value = null
    ElMessage.success(`已退出「${className}」`)
  } catch {
    // 错误已在拦截器中处理
  }
}

function handleJoined(classId: string, className: string) {
  loadClasses()
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

onMounted(() => {
  loadClasses()
})
</script>

<template>
  <div class="student-classes">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">我的班级</h1>
        <p class="page-header__subtitle">查看已加入的教学班级</p>
      </div>
      <el-button type="primary" size="large" @click="joinDialog?.open()">
        <el-icon><Plus /></el-icon>
        加入班级
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
      <el-button type="primary" @click="loadClasses">重新加载</el-button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!classStore.studentClasses.length" class="empty-state card">
      <el-icon :size="64" style="color: var(--color-primary-light)">
        <School />
      </el-icon>
      <h3>还没有加入任何班级</h3>
      <p>请向老师索取 8 位邀请码，加入你的班级吧</p>
      <el-button type="primary" size="large" @click="joinDialog?.open()">
        <el-icon><Plus /></el-icon>
        加入班级
      </el-button>
    </div>

    <!-- 班级列表 -->
    <div v-else class="class-list">
      <div
        v-for="cls in classStore.studentClasses"
        :key="cls.id"
        class="class-item card"
        :class="{ 'class-item--archived': cls.status === 'archived' }"
      >
        <div class="class-item__body">
          <div class="class-item__icon">
            <el-icon :size="24"><School /></el-icon>
          </div>
          <div class="class-item__info">
            <h3 class="class-item__name">{{ cls.name }}</h3>
            <div class="class-item__meta">
              <span>{{ cls.grade }} · {{ cls.subject }}</span>
              <span class="meta-sep">|</span>
              <span>加入于 {{ formatDate(cls.joined_at) }}</span>
            </div>
            <p
              v-if="cls.description"
              class="class-item__desc"
            >
              {{ cls.description }}
            </p>
          </div>
          <div class="class-item__actions">
            <el-tag
              :type="cls.status !== 'archived' ? 'success' : 'info'"
              size="small"
            >
              {{ cls.status !== 'archived' ? '进行中' : '已归档' }}
            </el-tag>
            <el-button
              type="primary"
              size="small"
              text
              @click="toggleResources(cls.id)"
            >
              <el-icon :size="14"><FolderOpened /></el-icon>
              {{ expandedClassId === cls.id ? '收起资源' : '查看资源' }}
            </el-button>
            <el-button
              v-if="cls.status !== 'archived'"
              type="danger"
              size="small"
              text
              @click="handleLeave(cls.id, cls.name)"
            >
              退出班级
            </el-button>
          </div>
        </div>
        <!-- 班级资源（可展开） -->
        <ClassResourceList
          v-if="expandedClassId === cls.id"
          :class-id="cls.id"
          :class-name="cls.name"
        />
      </div>
    </div>

    <!-- 加入班级弹窗 -->
    <JoinClassDialog ref="joinDialog" @success="handleJoined" />
  </div>
</template>

<style lang="scss" scoped>
.student-classes {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-base);

  &__title {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-xs);
    color: var(--color-text-primary);
  }

  &__subtitle {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    margin: 0;
  }
}

// ── 空状态 & 错误状态 ──
.loading-state {
  min-height: 300px;
}

.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xxl);
  min-height: 300px;
  gap: var(--spacing-md);

  h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  p {
    color: var(--color-text-secondary);
    margin: 0;
    line-height: var(--line-height-base);
  }
}

// ── 班级列表 ──
.class-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.class-item {
  padding: var(--spacing-lg) var(--spacing-xl);
  transition: all var(--transition-base);

  &--archived {
    opacity: 0.7;
  }

  &__body {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: var(--color-primary-lighter);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-xs);
  }

  &__meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;

    .meta-sep {
      color: var(--color-border);
    }
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: var(--spacing-sm) 0 0;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .class-item {
    &__body {
      flex-direction: column;
      align-items: flex-start;
    }

    &__actions {
      flex-direction: row;
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
