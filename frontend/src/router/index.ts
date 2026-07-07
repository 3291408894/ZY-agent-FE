/** 智翼平台 — 路由配置 (Vue Router 4) */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// ── 路由懒加载 ──
const LoginView = () => import('@/views/auth/LoginView.vue')
const RegisterView = () => import('@/views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@/views/auth/ForgotPasswordView.vue')
const DashboardView = () => import('@/views/dashboard/DashboardView.vue')
const AgentView = () => import('@/views/agent/AgentView.vue')
const SummaryView = () => import('@/views/summary/SummaryView.vue')
const ExerciseView = () => import('@/views/exercise/ExerciseView.vue')
const FilesView = () => import('@/views/files/FilesView.vue')
const KnowledgeView = () => import('@/views/knowledge/KnowledgeView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
// ── 教师端页面 ──
const ExamPaperIndex = () => import('@/views/teacher/exam-paper/Index.vue')
const ExamPaperDetail = () => import('@/views/teacher/exam-paper/Detail.vue')

// ── 路由表 ──
const routes: RouteRecordRaw[] = [
  // 认证页（全屏布局，无需登录）
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { layout: 'fullscreen', guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { layout: 'fullscreen', guest: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { layout: 'fullscreen', guest: true },
  },

  // 主要页面（标准布局，需登录）
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/agent',
    name: 'Agent',
    component: AgentView,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/summary',
    name: 'Summary',
    component: SummaryView,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/exercise',
    name: 'Exercise',
    component: ExerciseView,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/files',
    name: 'Files',
    component: FilesView,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: KnowledgeView,
    meta: { layout: 'default', requiresAuth: true },
  },

  // ── 教师端 ──
  {
    path: '/teacher',
    redirect: '/teacher/exam-paper',
  },
  {
    path: '/teacher/exam-paper',
    name: 'ExamPaper',
    component: ExamPaperIndex,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/exam-paper/:id',
    name: 'ExamPaperDetail',
    component: ExamPaperDetail,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },

  // 默认重定向 → 启动即进登录页
  {
    path: '/',
    redirect: '/login',
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { layout: 'fullscreen', guest: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// ── 导航守卫 ──
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token')

  // 需要登录的页面
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
