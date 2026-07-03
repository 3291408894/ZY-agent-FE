// ================================================================
// 智翼 (ZhiYi) — 认证组合式函数
// ================================================================

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const currentUser = computed(() => userStore.profile)

  /** 登录成功后跳转 */
  function onLoginSuccess(token: string, user: Parameters<typeof userStore.setAuth>[1]) {
    userStore.setAuth(token, user)
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
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

  return {
    isLoggedIn,
    currentUser,
    onLoginSuccess,
    logout,
    requireAuth,
  }
}
