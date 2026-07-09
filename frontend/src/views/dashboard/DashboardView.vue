<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getDashboard } from '@/api/modules/auth'
import type { IDashboardData } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref(false)
const data = ref<IDashboardData | null>(null)

/** 页面存活时长（秒）—— 用于累计学习时长的实时计时 */
const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

/** 实时累计学习时长 = 后端历史值 + 本页面存活时长 */
const liveStudyTime = computed(() => {
  return (data.value?.total_study_time ?? 0) + elapsedSeconds.value
})

const shortcuts = [
  { label: 'AI 对话', icon: 'ChatDotRound', path: '/agent', color: '#5B9BD5' },
  { label: '课文总结', icon: 'Document', path: '/summary', color: '#67C23A' },
  { label: '习题练习', icon: 'EditPen', path: '/exercise', color: '#E6A23C' },
  { label: '文件管理', icon: 'FolderOpened', path: '/files', color: '#909399' },
]

const teacherShortcuts = [
  { label: '班级管理', icon: 'School', path: '/teacher/classes', color: '#5B9BD5' },
  { label: '作业管理', icon: 'EditPen', path: '/teacher/assignments', color: '#67C23A' },
  { label: '教案生成', icon: 'Notebook', path: '/lesson-plan', color: '#E6A23C' },
  { label: '资源库', icon: 'FolderOpened', path: '/teacher/resources', color: '#909399' },
]

function fmtTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h} 小时 ${m} 分钟` : `${m} 分钟`
}

async function loadDashboard() {
  error.value = false
  loading.value = true
  try { data.value = await getDashboard() }
  catch { error.value = true }
  finally { loading.value = false }
}

onMounted(() => {
  loadDashboard()
  // 启动实时计时器：每秒 +1
  timer = setInterval(() => { elapsedSeconds.value++ }, 1000)
})

onUnmounted(() => {
  if (timer) { clearInterval(timer); timer = null }
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">你好，{{ userStore.profile?.nickname || (userStore.isTeacher ? '老师' : '同学') }} 👋</h1>
        <p class="page-header__subtitle">{{ userStore.isTeacher ? '管理班级、作业和教学资源，高效开展教学工作' : '今天想学点什么？AI 助手随时为你服务' }}</p>
      </div>
    </div>

    <!-- 快捷入口：根据角色显示不同快捷方式 -->
    <div class="quick-row">
      <template v-if="userStore.isTeacher">
        <button v-for="a in teacherShortcuts" :key="a.path" class="quick-card" @click="router.push(a.path)">
          <span class="quick-card__icon" :style="{ background: a.color }">
            <el-icon :size="22" color="#fff"><component :is="a.icon" /></el-icon>
          </span>
          <span class="quick-card__label">{{ a.label }}</span>
        </button>
      </template>
      <template v-else>
        <button v-for="a in shortcuts" :key="a.path" class="quick-card" @click="router.push(a.path)">
          <span class="quick-card__icon" :style="{ background: a.color }">
            <el-icon :size="22" color="#fff"><component :is="a.icon" /></el-icon>
          </span>
          <span class="quick-card__label">{{ a.label }}</span>
        </button>
      </template>
    </div>

    <!-- 教师仪表盘：教学统计 -->
    <template v-if="userStore.isTeacher">
      <h2 class="section-title">教学概览</h2>
      <div class="stats-row" v-loading="loading">
        <template v-if="error">
          <div class="stats-error card">
            <el-icon :size="40" style="color:var(--color-info);margin-bottom:var(--spacing-base)"><WarningFilled /></el-icon>
            <p>数据加载失败，请检查网络后刷新重试</p>
            <el-button type="primary" size="small" style="margin-top:var(--spacing-base)" @click="loadDashboard">重新加载</el-button>
          </div>
        </template>
        <template v-else>
          <div class="stat-card card">
            <div class="stat-card__icon" style="background:var(--color-primary-light);color:var(--color-primary)"><el-icon :size="24"><Timer /></el-icon></div>
            <div class="stat-card__val">{{ data ? fmtTime(liveStudyTime) : '--' }}</div>
            <div class="stat-card__lbl">平台使用时长</div>
          </div>
          <div class="stat-card card">
            <div class="stat-card__icon" style="background:var(--color-warning-light);color:var(--color-warning)"><el-icon :size="24"><EditPen /></el-icon></div>
            <div class="stat-card__val">{{ data ? data.total_exercises + ' 题' : '--' }}</div>
            <div class="stat-card__lbl">累计出题/批改数</div>
          </div>
          <div class="stat-card card">
            <div class="stat-card__icon" style="background:var(--color-success-light);color:var(--color-success)"><el-icon :size="24"><School /></el-icon></div>
            <div class="stat-card__val">{{ data ? (data.recent_summaries?.length ?? 0) + ' 篇' : '--' }}</div>
            <div class="stat-card__lbl">近期总结数</div>
          </div>
        </template>
      </div>
    </template>

    <!-- 学生仪表盘：学习概览 -->
    <template v-else>
    <h2 class="section-title">学习概览</h2>
    <div class="stats-row" v-loading="loading">
      <template v-if="error">
        <div class="stats-error card">
          <el-icon :size="40" style="color:var(--color-info);margin-bottom:var(--spacing-base)"><WarningFilled /></el-icon>
          <p>数据加载失败，请检查网络后刷新重试</p>
          <el-button type="primary" size="small" style="margin-top:var(--spacing-base)" @click="loadDashboard">重新加载</el-button>
        </div>
      </template>
      <template v-else>
        <div class="stat-card card">
          <div class="stat-card__icon" style="background:var(--color-primary-light);color:var(--color-primary)"><el-icon :size="24"><Timer /></el-icon></div>
          <div class="stat-card__val">{{ data ? fmtTime(liveStudyTime) : '--' }}</div>
          <div class="stat-card__lbl">累计学习时长</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__icon" style="background:var(--color-warning-light);color:var(--color-warning)"><el-icon :size="24"><EditPen /></el-icon></div>
          <div class="stat-card__val">{{ data ? data.total_exercises + ' 题' : '--' }}</div>
          <div class="stat-card__lbl">累计做题数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-card__icon" style="background:var(--color-success-light);color:var(--color-success)"><el-icon :size="24"><CircleCheck /></el-icon></div>
          <div class="stat-card__val">{{ data ? (data.correct_rate * 100).toFixed(0) + '%' : '--' }}</div>
          <div class="stat-card__lbl">正确率</div>
        </div>
      </template>
    </div>

    <div v-if="data?.weak_points?.length" style="margin-top:var(--spacing-xl)">
      <h2 class="section-title">薄弱知识点</h2>
      <div style="display:flex;flex-wrap:wrap;gap:var(--spacing-sm);margin-top:var(--spacing-sm)">
        <el-tag v-for="w in data.weak_points" :key="w" type="warning" size="large">{{ w }}</el-tag>
      </div>
    </div>

    <div class="cta card-hover" style="margin-top:var(--spacing-xxl)">
      <div>
        <h2>开始新的学习</h2>
        <p style="color:var(--color-text-secondary);margin:var(--spacing-xs) 0 var(--spacing-base)">在 AI 助手中输入你想学的内容，智能生成总结和练习题</p>
        <el-button type="primary" size="large" @click="router.push('/agent')"><el-icon><ChatDotRound /></el-icon> 开始对话</el-button>
      </div>
      <svg viewBox="0 0 160 100" fill="none" width="160"><rect x="10" y="20" width="140" height="60" rx="12" fill="var(--color-primary-light)"/><circle cx="45" cy="50" r="15" fill="var(--color-primary)" opacity=".3"/><rect x="70" y="40" width="60" height="5" rx="2" fill="var(--color-primary)" opacity=".5"/><rect x="70" y="50" width="40" height="5" rx="2" fill="var(--color-primary)" opacity=".3"/></svg>
    </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.quick-row { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--spacing-base); margin-bottom:var(--spacing-xxl); }
.quick-card { display:flex; align-items:center; gap:var(--spacing-md); padding:var(--spacing-lg); border:1px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-bg-card); cursor:pointer; transition:all var(--transition-base); &:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); border-color:var(--color-primary-light); }
  &__icon { width:40px; height:40px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  &__label { font-size:var(--font-size-base); font-weight:var(--font-weight-medium); color:var(--color-text-primary); }
}
.stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:var(--spacing-base); margin-top:var(--spacing-base); }
.stats-error { grid-column:1/-1; text-align:center; padding:var(--spacing-xxl); color:var(--color-text-secondary); }
.stat-card { text-align:center; padding:var(--spacing-xl);
  &__icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto var(--spacing-md); }
  &__val { font-size:var(--font-size-xxl); font-weight:var(--font-weight-bold); color:var(--color-text-primary); }
  &__lbl { font-size:var(--font-size-sm); color:var(--color-text-secondary); margin-top:var(--spacing-xs); }
}
.section-title { font-size:var(--font-size-lg); font-weight:var(--font-weight-semibold); }
.cta { display:flex; align-items:center; justify-content:space-between; padding:var(--spacing-xxl); background:linear-gradient(135deg,var(--color-primary-lighter),var(--color-bg-card));
  svg { flex-shrink:0; @media(max-width:768px){ display:none; } }
}
@media(max-width:768px){ .quick-row{ grid-template-columns:repeat(2,1fr) } .stats-row{ grid-template-columns:1fr } }
</style>
