// ================================================================
// 智翼 (ZhiYi) — Vue Router 路由配置
// 对应 PBI_02：首页导航 + 功能布局
// ================================================================

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

// ── 路由定义 ──
const routes: RouteRecordRaw[] = [
  // ================================================================
  // 认证页面（全屏布局，无侧边栏）
  // ================================================================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录 - 智翼', requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: '注册 - 智翼', requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { title: '找回密码 - 智翼', requiresAuth: false },
  },

  // ================================================================
  // 主功能页面（标准布局，需登录）
  // ================================================================
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: {
      title: '学习仪表盘 - 智翼',
      requiresAuth: true,
      icon: 'Odometer',
    },
  },
  {
    path: '/agent',
    name: 'Agent',
    component: () => import('@/views/agent/AgentView.vue'),
    meta: {
      title: 'AI 助手 - 智翼',
      requiresAuth: true,
      icon: 'ChatDotRound',
    },
  },
  {
    path: '/agent/:sessionId',
    name: 'AgentSession',
    component: () => import('@/views/agent/AgentView.vue'),
    meta: { title: '对话 - 智翼', requiresAuth: true },
  },
  {
    path: '/summary',
    name: 'Summary',
    component: () => import('@/views/summary/SummaryView.vue'),
    meta: {
      title: '课文总结 - 智翼',
      requiresAuth: true,
      icon: 'Document',
    },
  },
  {
    path: '/exercise',
    name: 'Exercise',
    component: () => import('@/views/exercise/ExerciseView.vue'),
    meta: {
      title: '习题练习 - 智翼',
      requiresAuth: true,
      icon: 'EditPen',
      upcoming: true,
    },
  },
  {
    path: '/files',
    name: 'Files',
    component: () => import('@/views/files/FilesView.vue'),
    meta: {
      title: '文件管理 - 智翼',
      requiresAuth: true,
      icon: 'FolderOpened',
      upcoming: true,
    },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/auth/ProfileView.vue'),
    meta: {
      title: '个人资料 - 智翼',
      requiresAuth: true,
      icon: 'User',
    },
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/knowledge/KnowledgeView.vue'),
    meta: {
      title: '知识图谱 - 智翼',
      requiresAuth: true,
      icon: 'Share',
      upcoming: true,
    },
  },

  // ================================================================
  // 默认重定向
  // ================================================================
  {
    path: '/',
    redirect: '/dashboard',
  },

  // ================================================================
  // 404
  // ================================================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404 - 智翼', requiresAuth: false },
  },
]

// ── 创建路由实例 ──
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ── 全局前置守卫：登录校验 + 页面标题 ──
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || '智翼 AI 学习助手'

  // 需要登录的路由
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('access_token')
    if (!token) {
      // 未登录 → 重定向到登录页，携带 redirect 参数
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 已登录用户访问登录/注册页 → 重定向到仪表盘
  if (!to.meta.requiresAuth && to.path.match(/^\/(login|register|forgot-password)/)) {
    const token = localStorage.getItem('access_token')
    if (token) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
