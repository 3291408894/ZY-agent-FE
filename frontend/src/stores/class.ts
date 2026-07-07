// ================================================================
// 智翼 (ZhiYi) — 班级管理系统状态管理 (Pinia Store)
// 对应班级管理系统接口文档，含教师端 + 学生端状态
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  IClassItem,
  IStudentClassItem,
  IRosterStudent,
} from '@/types'
import {
  getTeacherClasses,
  getClassDetail,
  getClassRoster,
  removeStudent as removeStudentApi,
  regenerateInviteCode as regenerateCodeApi,
  archiveClass as archiveClassApi,
  getStudentClasses,
  leaveClass as leaveClassApi,
} from '@/api/modules/class'

export const useClassStore = defineStore('class', () => {
  // ═══════════════════════════════════════════════════════
  // 教师端状态
  // ═══════════════════════════════════════════════════════

  const teacherClasses = ref<IClassItem[]>([])
  const teacherClassesLoading = ref(false)
  const currentClass = ref<IClassItem | null>(null)
  const currentClassLoading = ref(false)
  const roster = ref<IRosterStudent[]>([])
  const rosterLoading = ref(false)

  // ═══════════════════════════════════════════════════════
  // 学生端状态
  // ═══════════════════════════════════════════════════════

  const studentClasses = ref<IStudentClassItem[]>([])
  const studentClassesLoading = ref(false)

  // ═══════════════════════════════════════════════════════
  // 教师端 Getters
  // ═══════════════════════════════════════════════════════

  const activeClasses = computed(() =>
    teacherClasses.value.filter(c => c.status === 'active')
  )

  const archivedClasses = computed(() =>
    teacherClasses.value.filter(c => c.status === 'archived')
  )

  const hasClasses = computed(() => teacherClasses.value.length > 0)

  // ═══════════════════════════════════════════════════════
  // 教师端 Actions
  // ═══════════════════════════════════════════════════════

  /** 获取教师班级列表 */
  async function fetchTeacherClasses() {
    teacherClassesLoading.value = true
    try {
      const res = await getTeacherClasses()
      teacherClasses.value = res.classes
    } finally {
      teacherClassesLoading.value = false
    }
  }

  /** 获取班级详情 */
  async function fetchClassDetail(classId: string) {
    currentClassLoading.value = true
    try {
      const detail = await getClassDetail(classId)
      currentClass.value = detail
      return detail
    } finally {
      currentClassLoading.value = false
    }
  }

  /** 获取花名册 */
  async function fetchRoster(classId: string) {
    rosterLoading.value = true
    try {
      const res = await getClassRoster(classId)
      roster.value = res.roster
      return res.roster
    } finally {
      rosterLoading.value = false
    }
  }

  /** 移除学生 */
  async function removeStudent(classId: string, studentId: string) {
    await removeStudentApi(classId, studentId)
    // 从本地花名册中移除
    roster.value = roster.value.filter(s => s.student_id !== studentId)
    // 更新班级学生人数
    if (currentClass.value && currentClass.value.id === classId) {
      currentClass.value = {
        ...currentClass.value,
        student_count: Math.max(0, currentClass.value.student_count - 1),
      }
    }
    // 更新列表中的计数
    const idx = teacherClasses.value.findIndex(c => c.id === classId)
    if (idx !== -1) {
      teacherClasses.value[idx] = {
        ...teacherClasses.value[idx],
        student_count: Math.max(0, teacherClasses.value[idx].student_count - 1),
      }
    }
  }

  /** 重新生成邀请码 */
  async function regenerateCode(classId: string) {
    const res = await regenerateCodeApi(classId)
    // 更新当前班级和列表中的邀请码
    if (currentClass.value && currentClass.value.id === classId) {
      currentClass.value = {
        ...currentClass.value,
        invite_code: res.invite_code,
      }
    }
    const idx = teacherClasses.value.findIndex(c => c.id === classId)
    if (idx !== -1) {
      teacherClasses.value[idx] = {
        ...teacherClasses.value[idx],
        invite_code: res.invite_code,
      }
    }
    return res.invite_code
  }

  /** 归档班级 */
  async function archiveClass(classId: string) {
    await archiveClassApi(classId)
    // 更新状态
    if (currentClass.value && currentClass.value.id === classId) {
      currentClass.value = {
        ...currentClass.value,
        status: 'archived',
      }
    }
    const idx = teacherClasses.value.findIndex(c => c.id === classId)
    if (idx !== -1) {
      teacherClasses.value[idx] = {
        ...teacherClasses.value[idx],
        status: 'archived',
      }
    }
  }

  /** 从教师列表中移除班级（用于创建后刷新） */
  function addToTeacherList(classItem: IClassItem) {
    teacherClasses.value.unshift(classItem)
  }

  /** 重置当前班级状态 */
  function resetCurrentClass() {
    currentClass.value = null
    roster.value = []
  }

  // ═══════════════════════════════════════════════════════
  // 学生端 Actions
  // ═══════════════════════════════════════════════════════

  /** 获取学生班级列表 */
  async function fetchStudentClasses() {
    studentClassesLoading.value = true
    try {
      const res = await getStudentClasses()
      studentClasses.value = res.classes
    } finally {
      studentClassesLoading.value = false
    }
  }

  /** 退出班级 */
  async function leaveClass(classId: string) {
    await leaveClassApi(classId)
    studentClasses.value = studentClasses.value.filter(c => c.id !== classId)
  }

  /** 加入班级后添加到列表 */
  function addToStudentList(classItem: IStudentClassItem) {
    studentClasses.value.unshift(classItem)
  }

  return {
    // 教师端 state
    teacherClasses,
    teacherClassesLoading,
    currentClass,
    currentClassLoading,
    roster,
    rosterLoading,
    // 学生端 state
    studentClasses,
    studentClassesLoading,
    // 教师端 getters
    activeClasses,
    archivedClasses,
    hasClasses,
    // 教师端 actions
    fetchTeacherClasses,
    fetchClassDetail,
    fetchRoster,
    removeStudent,
    regenerateCode,
    archiveClass,
    addToTeacherList,
    resetCurrentClass,
    // 学生端 actions
    fetchStudentClasses,
    leaveClass,
    addToStudentList,
  }
})
