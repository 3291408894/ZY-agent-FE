<script setup lang="ts">
// ================================================================
// DashboardView — 学习仪表盘（智翼首页）
// 对应 PBI_02：展示学习统计数据、最近活动、推荐内容
// ================================================================

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ── Mock 仪表盘数据（后端接口就绪后替换为 API 调用） ──
const dashboardData = ref({
  totalStudyTime: 0, // 秒
  totalExercises: 0,
  correctRate: 0,
  recentSummaries: [] as any[],
  recentExercises: [] as any[],
  weakPoints: [] as string[],
})

const quickActions = [
  { label: 'AI 对话', icon: 'ChatDotRound', path: '/agent', color: '#5B9BD5' },
  { label: '课文总结', icon: 'Document', path: '/summary', color: '#67C23A' },
  { label: '习题练习', icon: 'EditPen', path: '/exercise', color: '#E6A23C' },
  { label: '文件上传', icon: 'Upload', path: '/files', color: '#909399' },
]

// ── 格式化学习时长 ──
function formatStudyTime(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours} 小时 ${mins} 分钟`
  return `${mins} 分钟`
}

onMounted(() => {
  // TODO: fetchDashboardData()
})
</script>

<template>
  <div class="dashboard">
    <!-- ── 欢迎区 ── -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">
          你好，{{ userStore.profile?.nickname || '同学' }} 👋
        </h1>
        <p class="page-header__subtitle">
          今天想学点什么？AI 助手随时为你服务
        </p>
      </div>
    </div>

    <!-- ── 快捷操作 ── -->
    <section class="dashboard__quick-actions">
      <button
        v-for="action in quickActions"
        :key="action.path"
        class="quick-action-card"
        @click="router.push(action.path)"
      >
        <div class="quick-action-card__icon" :style="{ background: action.color }">
          <el-icon :size="24" color="#fff">
            <component :is="action.icon" />
          </el-icon>
        </div>
        <span class="quick-action-card__label">{{ action.label }}</span>
      </button>
    </section>

    <!-- ── 数据概览 ── -->
    <section class="dashboard__stats">
      <h2 class="section-title">学习概览</h2>
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-card__icon stat-card__icon--time">
            <el-icon :size="28"><Timer /></el-icon>
          </div>
          <div class="stat-card__value">{{ formatStudyTime(dashboardData.totalStudyTime) }}</div>
          <div class="stat-card__label">累计学习时长</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__icon stat-card__icon--exercise">
            <el-icon :size="28"><EditPen /></el-icon>
          </div>
          <div class="stat-card__value">{{ dashboardData.totalExercises }} 题</div>
          <div class="stat-card__label">累计做题数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__icon stat-card__icon--correct">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-card__value">{{ (dashboardData.correctRate * 100).toFixed(0) }}%</div>
          <div class="stat-card__label">正确率</div>
        </div>
      </div>
    </section>

    <!-- ── 开始一段学习 ── -->
    <section class="dashboard__start">
      <div class="start-banner card-hover">
        <div class="start-banner__content">
          <h2>开始新的学习</h2>
          <p>在 AI 助手中输入你想学习的内容，智能生成总结和练习题</p>
          <el-button type="primary" size="large" @click="router.push('/agent')">
            <el-icon><ChatDotRound /></el-icon>
            开始对话
          </el-button>
        </div>
        <div class="start-banner__illustration">
          <!-- 装饰性 SVG -->
          <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="160" height="60" rx="12" fill="var(--color-primary-light)" />
            <circle cx="60" cy="60" r="18" fill="var(--color-primary)" opacity="0.3" />
            <rect x="90" y="48" width="70" height="6" rx="3" fill="var(--color-primary)" opacity="0.5" />
            <rect x="90" y="58" width="50" height="6" rx="3" fill="var(--color-primary)" opacity="0.3" />
          </svg>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  &__quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-base);
    margin-bottom: var(--spacing-xxl);
  }

  &__stats {
    margin-bottom: var(--spacing-xxl);
  }

  &__start {
    margin-bottom: var(--spacing-xl);
  }
}

// ── 快捷操作卡片 ──
.quick-action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--color-primary-light);
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
}

// ── 统计卡片 ──
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-base);
  margin-top: var(--spacing-base);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-xl);

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-round);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);

    &--time {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
    &--exercise {
      background: var(--color-warning-light);
      color: var(--color-warning);
    }
    &--correct {
      background: var(--color-success-light);
      color: var(--color-success);
    }
  }

  &__value {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  &__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

// ── 开始学习 Banner ──
.start-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xxl);
  background: linear-gradient(
    135deg,
    var(--color-primary-lighter) 0%,
    var(--color-bg-card) 100%
  );

  &__content {
    h2 {
      margin-bottom: var(--spacing-sm);
    }
    p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
      max-width: 360px;
    }
  }

  &__illustration {
    flex-shrink: 0;
    width: 200px;

    @media (max-width: 768px) {
      display: none;
    }
  }
}

// ── 区块标题 ──
.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

// ── 响应式 ──
@media (max-width: 768px) {
  .dashboard__quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
