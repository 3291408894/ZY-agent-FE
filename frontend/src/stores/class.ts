/**
 * 班级管理 Pinia Store (功能4)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IClassItem, IClassDetail, IClassRoster, IStudentClassItem, IJoinClassInfo } from '@/types'
import {
  createClass,
  getTeacherClasses,
  getClassDetail,
  getRoster,
  removeStudent,
  regenerateInviteCode,
  archiveClass,
  checkInviteCode,
  joinClass,
  getMyClasses,
  leaveClass,
} from '@/api/modules/class'

export const useClassStore = defineStore('class', () => {
  // ── State ──
  const teacherClasses = ref<IClassItem[]>([])
  const teacherClassesTotal = ref(0)
  const currentClass = ref<IClassDetail | null>(null)
  const currentRoster = ref<IClassRoster | null>(null)

  const studentClasses = ref<IStudentClassItem[]>([])
  const inviteClassInfo = ref<IJoinClassInfo | null>(null)

  const loading = ref(false)

  // ── Getters ──
  const activeClasses = computed(() =>
    teacherClasses.value.filter((c) => c.status === 'active')
  )

  // ── 教师端 Actions ──
  async function fetchTeacherClasses(page = 1, pageSize = 20, status?: string) {
    loading.value = true
    try {
      const data = await getTeacherClasses({ page, page_size: pageSize, status })
      teacherClasses.value = data.items
      teacherClassesTotal.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchClassDetail(classId: string) {
    loading.value = true
    try {
      const data = await getClassDetail(classId)
      currentClass.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchRoster(classId: string) {
    const data = await getRoster(classId)
    currentRoster.value = data
    return data
  }

  async function createNewClass(data: { name: string; grade: string; subject: string; description?: string }) {
    const result = await createClass(data)
    await fetchTeacherClasses()
    return result
  }

  async function removeStudentFromClass(classId: string, studentId: string) {
    await removeStudent(classId, studentId)
    if (currentClass.value && currentClass.value.id === classId) {
      await fetchClassDetail(classId)
    }
  }

  async function regenerateCode(classId: string) {
    const result = await regenerateInviteCode(classId)
    if (currentClass.value && currentClass.value.id === classId) {
      currentClass.value.invite_code = result.invite_code
    }
    return result
  }

  async function archiveClassAction(classId: string) {
    await archiveClass(classId)
    await fetchTeacherClasses()
  }

  // ── 学生端 Actions ──
  async function checkCode(inviteCode: string) {
    const data = await checkInviteCode(inviteCode)
    inviteClassInfo.value = data
    return data
  }

  async function joinByCode(inviteCode: string) {
    const result = await joinClass(inviteCode)
    inviteClassInfo.value = null
    await fetchStudentClasses()
    return result
  }

  async function fetchStudentClasses(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const data = await getMyClasses({ page, page_size: pageSize })
      studentClasses.value = data.items
      return data
    } finally {
      loading.value = false
    }
  }

  async function leaveClassAction(classId: string) {
    await leaveClass(classId)
    studentClasses.value = studentClasses.value.filter((c) => c.id !== classId)
  }

  function resetInviteInfo() {
    inviteClassInfo.value = null
  }

  return {
    teacherClasses,
    teacherClassesTotal,
    currentClass,
    currentRoster,
    studentClasses,
    inviteClassInfo,
    loading,
    activeClasses,
    fetchTeacherClasses,
    fetchClassDetail,
    fetchRoster,
    createNewClass,
    removeStudentFromClass,
    regenerateCode,
    archiveClassAction,
    checkCode,
    joinByCode,
    fetchStudentClasses,
    leaveClassAction,
    resetInviteInfo,
  }
})
