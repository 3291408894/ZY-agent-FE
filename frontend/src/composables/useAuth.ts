// ================================================================
// 智翼 (ZhiYi) — 认证组合式函数
// 封装登录态管理、Token 操作、路由守卫辅助
// ================================================================

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { IUserBrief } from '@/types'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const currentUser = computed(() => userStore.profile)

  /** 登录成功后跳转（按角色分流） */
  function onLoginSuccess(token: string, user: IUserBrief) {
    userStore.setAuth(token, user)
    // 有指定重定向目标则优先；否则按角色分流：教师 → 班级管理，学生 → 仪表盘
    const redirect = (router.currentRoute.value.query.redirect as string)
      || (user.role === 'teacher' || user.role === 'admin' ? '/teacher/classes' : '/dashboard')
    router.push(redirect)
  }

  /** 退出登录 */
  function logout() {
    userStore.clearAuth()
    router.push('/login')
  }

  /** 检查登录态，未登录则跳转 */
  function requireAuth(): boolean {
    if (!userStore.isLoggedIn) {
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      return false
    }
    return true
  }

  /** 从 localStorage 恢复登录态（初始化时调用） */
  function restoreAuth(): boolean {
    const token = localStorage.getItem('access_token')
    return !!token
  }

  return {
    isLoggedIn,
    currentUser,
    onLoginSuccess,
    logout,
    requireAuth,
    restoreAuth,
  }
}
