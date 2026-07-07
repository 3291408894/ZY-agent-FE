<script setup lang="ts">
// ================================================================
// 教师端 — 班级管理首页
// 班级卡片网格 + 空状态引导
// ================================================================

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useClassStore } from '@/stores/class'
import ClassCreateDialog from './components/ClassCreateDialog.vue'

const router = useRouter()
const classStore = useClassStore()
const createDialog = ref<InstanceType<typeof ClassCreateDialog>>()

const loading = ref(true)
const error = ref(false)

async function loadClasses() {
  error.value = false
  loading.value = true
  try {
    await classStore.fetchTeacherClasses()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function goToDetail(classId: string) {
  router.push(`/teacher/classes/${classId}`)
}

function handleCreated(classId: string) {
  goToDetail(classId)
}

async function copyInviteCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('邀请码已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

function getStatusTag(status: string) {
  return status === 'active' ? 'success' : 'info'
}

function getStatusText(status: string) {
  return status === 'active' ? '进行中' : '已归档'
}

onMounted(() => {
  loadClasses()
})
</script>

<template>
  <div class="teacher-classes">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">班级管理</h1>
        <p class="page-header__subtitle">管理你的教学班级，邀请学生加入</p>
      </div>
      <el-button type="primary" size="large" @click="createDialog?.open()">
        <el-icon><Plus /></el-icon>
        创建班级
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
    <div v-else-if="!classStore.hasClasses" class="empty-state card">
      <el-icon :size="64" style="color: var(--color-primary-light)">
        <School />
      </el-icon>
      <h3>暂无班级</h3>
      <p>点击「创建班级」按钮，创建你的第一个教学班级吧</p>
      <el-button type="primary" size="large" @click="createDialog?.open()">
        <el-icon><Plus /></el-icon>
        创建第一个班级
      </el-button>
    </div>

    <!-- 班级卡片网格 -->
    <div v-else class="class-grid">
      <!-- 进行中的班级 -->
      <template v-if="classStore.activeClasses.length">
        <div class="section-label">
          <span class="section-label__dot" />
          进行中（{{ classStore.activeClasses.length }}）
        </div>
        <div class="class-grid__row">
          <div
            v-for="cls in classStore.activeClasses"
            :key="cls.id"
            class="class-card card card-hover"
            @click="goToDetail(cls.id)"
          >
            <div class="class-card__body">
              <div class="class-card__icon">
                <el-icon :size="28"><School /></el-icon>
              </div>
              <div class="class-card__info">
                <h3 class="class-card__name">{{ cls.name }}</h3>
                <div class="class-card__meta">
                  <span>{{ cls.grade }}</span>
                  <span class="class-card__dot">·</span>
                  <span>{{ cls.subject }}</span>
                </div>
                <div class="class-card__bottom">
                  <el-tag :type="getStatusTag(cls.status)" size="small">
                    {{ getStatusText(cls.status) }}
                  </el-tag>
                  <span class="class-card__students">
                    <el-icon :size="14"><User /></el-icon>
                    {{ cls.student_count }} 人
                  </span>
                </div>
              </div>
            </div>
            <div class="class-card__invite">
              <span class="class-card__invite-label">邀请码</span>
              <code class="class-card__invite-code">{{ cls.invite_code }}</code>
              <el-button
                size="small"
                text
                type="primary"
                @click.stop="copyInviteCode(cls.invite_code)"
              >
                复制
              </el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 已归档的班级 -->
      <template v-if="classStore.archivedClasses.length">
        <div class="section-label section-label--muted">
          <span class="section-label__dot section-label__dot--muted" />
          已归档（{{ classStore.archivedClasses.length }}）
        </div>
        <div class="class-grid__row">
          <div
            v-for="cls in classStore.archivedClasses"
            :key="cls.id"
            class="class-card class-card--archived card card-hover"
            @click="goToDetail(cls.id)"
          >
            <div class="class-card__body">
              <div class="class-card__icon class-card__icon--muted">
                <el-icon :size="28"><School /></el-icon>
              </div>
              <div class="class-card__info">
                <h3 class="class-card__name">{{ cls.name }}</h3>
                <div class="class-card__meta">
                  <span>{{ cls.grade }}</span>
                  <span class="class-card__dot">·</span>
                  <span>{{ cls.subject }}</span>
                </div>
                <div class="class-card__bottom">
                  <el-tag :type="getStatusTag(cls.status)" size="small">
                    {{ getStatusText(cls.status) }}
                  </el-tag>
                  <span class="class-card__students">
                    <el-icon :size="14"><User /></el-icon>
                    {{ cls.student_count }} 人
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 创建班级弹窗 -->
    <ClassCreateDialog ref="createDialog" @success="handleCreated" />
  </div>
</template>

<style lang="scss" scoped>
.teacher-classes {
  max-width: 960px;
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

// ── 分区标签 ──
.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-base);

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);

    &--muted {
      background: var(--color-info);
    }
  }

  &--muted {
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xl);
  }
}

// ── 卡片网格 ──
.class-grid {
  &__row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--spacing-base);
  }
}

// ── 班级卡片 ──
.class-card {
  padding: var(--spacing-xl);
  cursor: pointer;

  &--archived {
    opacity: 0.7;
  }

  &__body {
    display: flex;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
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

    &--muted {
      background: var(--color-info-light);
      color: var(--color-info);
    }
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  &__dot {
    margin: 0 var(--spacing-xs);
  }

  &__bottom {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__students {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__invite {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border-light);
  }

  &__invite-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  &__invite-code {
    font-family: var(--font-family-code);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 3px;
    color: var(--color-primary-dark);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;

    &__title {
      font-size: var(--font-size-h2);
    }
  }

  .class-grid__row {
    grid-template-columns: 1fr;
  }
}
</style>
