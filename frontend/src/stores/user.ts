// ================================================================
// 智翼 (ZhiYi) — 用户状态管理 (Pinia Store)
// 对应 PBI_01：用户注册登录 + 个人档案
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUserProfile, ILearningProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  // ================================================================
  // State
  // ================================================================
  const profile = ref<IUserProfile | null>(null)
  const learningProfile = ref<ILearningProfile | null>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))

  // ================================================================
  // Getters
  // ================================================================
  const isLoggedIn = computed(() => !!token.value && !!profile.value)
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
  function setAuth(accessToken: string, user: IUserProfile) {
    token.value = accessToken
    profile.value = user
    localStorage.setItem('access_token', accessToken)
  }

  function clearAuth() {
    token.value = null
    profile.value = null
    learningProfile.value = null
    localStorage.removeItem('access_token')
  }

  // ================================================================
  // Actions — 档案
  // ================================================================
  function setProfile(user: IUserProfile) {
    profile.value = user
  }

  function updateProfile(partial: Partial<IUserProfile>) {
    if (profile.value) {
      profile.value = { ...profile.value, ...partial }
    }
  }

  function setLearningProfile(lp: ILearningProfile) {
    learningProfile.value = lp
  }

  return {
    // state
    profile,
    learningProfile,
    token,
    // getters
    isLoggedIn,
    userId,
    userGrade,
    userSubjects,
    isProfileComplete,
    // actions
    setAuth,
    clearAuth,
    setProfile,
    updateProfile,
    setLearningProfile,
  }
})
