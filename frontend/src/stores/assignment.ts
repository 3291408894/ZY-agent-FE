/**
 * 作业管理 Pinia Store (功能5)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  IAssignmentItem,
  IAssignmentDetail,
  ISubmissionItem,
  ISubmissionDetail,
  IStudentAssignmentItem,
  IAssignmentStats,
  IAIFeedback,
} from '@/types'
import {
  createAssignment,
  getTeacherAssignments,
  getAssignmentDetail,
  deleteAssignment,
  getSubmissions,
  getSubmissionDetail,
  gradeSubmission,
  batchGrade,
  returnSubmission,
  getAssignmentStats,
  getMyAssignments,
  getStudentAssignmentDetail,
  submitAssignment,
  getMySubmission,
} from '@/api/modules/assignment'

export const useAssignmentStore = defineStore('assignment', () => {
  // ── State ──
  const assignments = ref<IAssignmentItem[]>([])
  const assignmentsTotal = ref(0)
  const currentAssignment = ref<IAssignmentDetail | null>(null)

  const submissions = ref<ISubmissionItem[]>([])
  const submissionsTotal = ref(0)
  const currentSubmission = ref<ISubmissionDetail | null>(null)

  const stats = ref<IAssignmentStats | null>(null)

  // 学生端
  const myAssignments = ref<IStudentAssignmentItem[]>([])
  const myAssignmentsTotal = ref(0)

  const batchGradingResult = ref<{
    total: number
    success: number
    failed: number
    details: Array<{ submission_id: string; status: string; score?: number; error?: string }>
  } | null>(null)

  const loading = ref(false)

  // ── Getters ──
  const activeAssignments = computed(() =>
    assignments.value.filter((a) => a.status === 'active')
  )
  const pendingSubmissions = computed(() =>
    submissions.value.filter((s) => s.status === 'submitted')
  )

  // ── 教师端 Actions ──
  async function fetchTeacherAssignments(params?: {
    page?: number
    page_size?: number
    class_id?: string
    status?: string
    subject?: string
  }) {
    loading.value = true
    try {
      const data = await getTeacherAssignments(params)
      assignments.value = data.items
      assignmentsTotal.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchAssignmentDetail(assignmentId: string) {
    loading.value = true
    try {
      const data = await getAssignmentDetail(assignmentId)
      currentAssignment.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function createNewAssignment(data: Parameters<typeof createAssignment>[0]) {
    const result = await createAssignment(data)
    await fetchTeacherAssignments()
    return result
  }

  async function removeAssignment(assignmentId: string) {
    await deleteAssignment(assignmentId)
    assignments.value = assignments.value.filter((a) => a.id !== assignmentId)
  }

  async function fetchSubmissions(assignmentId: string, params?: { page?: number; page_size?: number; status?: string }) {
    loading.value = true
    try {
      const data = await getSubmissions(assignmentId, params)
      submissions.value = data.items
      submissionsTotal.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchSubmissionDetail(assignmentId: string, submissionId: string) {
    const data = await getSubmissionDetail(assignmentId, submissionId)
    currentSubmission.value = data
    return data
  }

  async function gradeAction(
    assignmentId: string,
    submissionId: string,
    data: { scores?: Array<{ question_number: number; score: number }>; teacher_feedback?: string; confirm_ai_feedback?: boolean }
  ) {
    const result = await gradeSubmission(assignmentId, submissionId, data)
    if (currentSubmission.value && currentSubmission.value.id === submissionId) {
      currentSubmission.value.score = result.score
      currentSubmission.value.teacher_feedback = result.teacher_feedback
      currentSubmission.value.status = result.status
    }
    return result
  }

  async function batchGradeAction(assignmentId: string, submissionIds?: string[]) {
    const result = await batchGrade(assignmentId, submissionIds)
    batchGradingResult.value = result
    await fetchSubmissions(assignmentId)
    return result
  }

  async function returnSubmissionAction(assignmentId: string, submissionId: string) {
    await returnSubmission(assignmentId, submissionId)
    if (currentSubmission.value && currentSubmission.value.id === submissionId) {
      currentSubmission.value.status = 'returned'
    }
  }

  async function fetchStats(assignmentId: string) {
    const data = await getAssignmentStats(assignmentId)
    stats.value = data
    return data
  }

  // ── 学生端 Actions ──
  async function fetchMyAssignments(params?: { page?: number; page_size?: number; status?: string }) {
    loading.value = true
    try {
      const data = await getMyAssignments(params)
      myAssignments.value = data.items
      myAssignmentsTotal.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchStudentAssignmentDetail(assignmentId: string) {
    const data = await getStudentAssignmentDetail(assignmentId)
    return data
  }

  async function submitAction(assignmentId: string, content: { answers: { question_number: number; answer: string }[] }, attachments?: Array<{ name: string; url: string }> | null) {
    await submitAssignment(assignmentId, { content, attachments })
    await fetchMyAssignments()
  }

  async function fetchMySubmission(assignmentId: string) {
    const data = await getMySubmission(assignmentId)
    currentSubmission.value = data
    return data
  }

  function clearCurrent() {
    currentAssignment.value = null
    currentSubmission.value = null
    stats.value = null
    batchGradingResult.value = null
  }

  return {
    assignments,
    assignmentsTotal,
    currentAssignment,
    submissions,
    submissionsTotal,
    currentSubmission,
    stats,
    myAssignments,
    myAssignmentsTotal,
    batchGradingResult,
    loading,
    activeAssignments,
    pendingSubmissions,
    fetchTeacherAssignments,
    fetchAssignmentDetail,
    createNewAssignment,
    removeAssignment,
    fetchSubmissions,
    fetchSubmissionDetail,
    gradeAction,
    batchGradeAction,
    returnSubmissionAction,
    fetchStats,
    fetchMyAssignments,
    fetchStudentAssignmentDetail,
    submitAction,
    fetchMySubmission,
    clearCurrent,
  }
})
