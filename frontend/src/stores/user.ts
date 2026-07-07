// ================================================================
// 智翼 (ZhiYi) — 用户状态管理 (Pinia Store)
// 对应 PBI_01：用户注册登录 + 个人档案
// 与 认证模块接口说明书.md 对齐
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUserBrief, IUserProfile } from '@/types'
import { getProfile, updateProfile } from '@/api/modules/auth'

export const useUserStore = defineStore('user', () => {
  // ================================================================
  // State
  // ================================================================
  const profile = ref<IUserBrief | IUserProfile | null>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))

  // ================================================================
  // Getters
  // ================================================================
  const isLoggedIn = computed(() => !!token.value && !!profile.value)
  const isTeacher = computed(() => profile.value?.role === 'teacher' || profile.value?.role === 'admin')
  const userId = computed(() => profile.value?.id ?? null)
  const userGrade = computed(() => profile.value?.grade ?? '')
  const userSubjects = computed(() => profile.value?.subjects ?? [])
  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    const { grade, subjects } = profile.value
    return !!(grade && subjects && subjects.length > 0)
  })

  // ================================================================
  // Actions — 认证
  // ================================================================

  /** 设置登录态（登录成功后调用） */
  function setAuth(accessToken: string, user: IUserBrief) {
    token.value = accessToken
    profile.value = user
    localStorage.setItem('access_token', accessToken)
  }

  /** 清除登录态（退出登录或 Token 过期时调用） */
  function clearAuth() {
    token.value = null
    profile.value = null
    localStorage.removeItem('access_token')
  }

  // ================================================================
  // Actions — 档案
  // ================================================================

  /** 设置用户信息 */
  function setProfile(user: IUserBrief | IUserProfile) {
    profile.value = user
  }

  /** 本地乐观更新（不调 API） */
  function updateProfileLocal(partial: Partial<IUserProfile>) {
    if (profile.value) {
      profile.value = { ...profile.value, ...partial }
    }
  }

  /** 从后端获取完整资料 */
  async function fetchProfile() {
    const data = await getProfile()
    profile.value = data
    return data
  }

  /** 更新资料并刷新本地状态 */
  async function updateUserProfile(data: {
    nickname?: string
    grade?: string
    subjects?: string[]
    textbook_version?: string
  }) {
    const updated = await updateProfile(data)
    profile.value = updated
    return updated
  }

  return {
    // state
    profile,
    token,
    // getters
    isLoggedIn,
    isTeacher,
    userId,
    userGrade,
    userSubjects,
    isProfileComplete,
    // actions
    setAuth,
    clearAuth,
    setProfile,
    updateProfileLocal,
    fetchProfile,
    updateUserProfile,
  }
})
