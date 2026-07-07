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

// ── 教师端 ──
const TeacherClassesIndex = () => import('@/views/teacher/classes/Index.vue')
const TeacherClassesDetail = () => import('@/views/teacher/classes/Detail.vue')
const TeacherAssignmentsIndex = () => import('@/views/teacher/assignments/Index.vue')
const TeacherAssignmentsDetail = () => import('@/views/teacher/assignments/Detail.vue')
const TeacherAssignmentsSubmissions = () => import('@/views/teacher/assignments/Submissions.vue')
const TeacherAssignmentsGrading = () => import('@/views/teacher/assignments/GradingView.vue')
const TeacherAssignmentsStats = () => import('@/views/teacher/assignments/StatsView.vue')
const TeacherResourcesIndex = () => import('@/views/teacher/resources/Index.vue')

// ── 学生端 ──
const StudentClassesIndex = () => import('@/views/student/classes/Index.vue')
const StudentAssignmentsIndex = () => import('@/views/student/assignments/Index.vue')
const StudentAssignmentsDetail = () => import('@/views/student/assignments/Detail.vue')
const StudentAssignmentsResult = () => import('@/views/student/assignments/Result.vue')

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

  // ── 教师端路由 ──
  {
    path: '/teacher/resources',
    name: 'TeacherResources',
    component: TeacherResourcesIndex,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/classes',
    name: 'TeacherClasses',
    component: TeacherClassesIndex,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/classes/:id',
    name: 'TeacherClassDetail',
    component: TeacherClassesDetail,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/assignments',
    name: 'TeacherAssignments',
    component: TeacherAssignmentsIndex,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/assignments/:id',
    name: 'TeacherAssignmentDetail',
    component: TeacherAssignmentsDetail,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/assignments/:id/submissions',
    name: 'TeacherAssignmentSubmissions',
    component: TeacherAssignmentsSubmissions,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/assignments/:id/grade/:submissionId',
    name: 'TeacherAssignmentGrading',
    component: TeacherAssignmentsGrading,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },
  {
    path: '/teacher/assignments/:id/stats',
    name: 'TeacherAssignmentStats',
    component: TeacherAssignmentsStats,
    meta: { layout: 'default', requiresAuth: true, requiredRole: 'teacher' },
  },

  // ── 学生端路由 ──
  {
    path: '/student/classes',
    name: 'StudentClasses',
    component: StudentClassesIndex,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/student/assignments',
    name: 'StudentAssignments',
    component: StudentAssignmentsIndex,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/student/assignments/:id',
    name: 'StudentAssignmentDetail',
    component: StudentAssignmentsDetail,
    meta: { layout: 'default', requiresAuth: true },
  },
  {
    path: '/student/assignments/:id/result',
    name: 'StudentAssignmentResult',
    component: StudentAssignmentsResult,
    meta: { layout: 'default', requiresAuth: true },
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

  // 角色校验：教师路由仅教师/admin可访问
  if (to.meta.requiredRole === 'teacher') {
    try {
      // 从 localStorage 读取用户信息进行角色校验
      const userStr = localStorage.getItem('user_profile')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role !== 'teacher' && user.role !== 'admin') {
          next('/dashboard')
          return
        }
      } else {
        next('/dashboard')
        return
      }
    } catch {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
