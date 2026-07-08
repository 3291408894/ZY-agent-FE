/**
 * 作业管理 API 模块 (功能5) — 教师端 + 学生端
 */

import { get, post, del } from '../request'
import type {
  IAssignmentCreate,
  IAssignmentItem,
  IAssignmentDetail,
  ISubmissionItem,
  ISubmissionDetail,
  ISubmissionCreate,
  IAssignmentStats,
  IStudentAssignmentItem,
  IGradingRequest,
  IBatchGradeResult,
  IGradeResult,
} from '@/types'

// ═══════════════════════════════════════════════════
// 教师端
// ═══════════════════════════════════════════════════

/** 布置作业 */
export function createAssignment(data: IAssignmentCreate): Promise<IAssignmentItem> {
  return post('/api/v1/teacher/assignments', data)
}

/** 作业列表 */
export function getTeacherAssignments(params?: {
  page?: number
  page_size?: number
  class_id?: string
  status?: string
  subject?: string
}): Promise<{ items: IAssignmentItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get('/api/v1/teacher/assignments', params)
}

/** 作业详情 */
export function getAssignmentDetail(assignmentId: string): Promise<IAssignmentDetail> {
  return get(`/api/v1/teacher/assignments/${assignmentId}`)
}

/** 修改作业 */
export function updateAssignment(assignmentId: string, data: Partial<IAssignmentCreate>): Promise<void> {
  return post(`/api/v1/teacher/assignments/${assignmentId}`, data)
}

/** 删除作业 */
export function deleteAssignment(assignmentId: string): Promise<void> {
  return del(`/api/v1/teacher/assignments/${assignmentId}`)
}

/** 提交列表 */
export function getSubmissions(
  assignmentId: string,
  params?: { page?: number; page_size?: number; status?: string }
): Promise<{ items: ISubmissionItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get(`/api/v1/teacher/assignments/${assignmentId}/submissions`, params)
}

/** 提交详情 */
export function getSubmissionDetail(
  assignmentId: string,
  submissionId: string
): Promise<ISubmissionDetail> {
  return get(`/api/v1/teacher/assignments/${assignmentId}/submissions/${submissionId}`)
}

/** 批改评分 */
export function gradeSubmission(
  assignmentId: string,
  submissionId: string,
  data: IGradingRequest
): Promise<IGradeResult> {
  return post(`/api/v1/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`, data)
}

/** 批量AI批改 */
export function batchGrade(
  assignmentId: string,
  submissionIds?: string[]
): Promise<IBatchGradeResult> {
  return post(`/api/v1/teacher/assignments/${assignmentId}/batch-grade`, {
    submission_ids: submissionIds || null,
  })
}

/** 退回重做 */
export function returnSubmission(assignmentId: string, submissionId: string): Promise<void> {
  return post(`/api/v1/teacher/assignments/${assignmentId}/submissions/${submissionId}/return`)
}

/** 作业统计 */
export function getAssignmentStats(assignmentId: string): Promise<IAssignmentStats> {
  return get(`/api/v1/teacher/assignments/${assignmentId}/stats`)
}

/** 提醒未提交 */
export function remindUnsubmitted(assignmentId: string): Promise<{ unsubmitted_count: number; unsubmitted_student_ids: string[] }> {
  return post(`/api/v1/teacher/assignments/${assignmentId}/remind`)
}

// ═══════════════════════════════════════════════════
// 学生端
// ═══════════════════════════════════════════════════

/** 我的作业列表 */
export function getMyAssignments(params?: {
  page?: number
  page_size?: number
  status?: string
}): Promise<{ items: IStudentAssignmentItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get('/api/v1/student/assignments', params)
}

/** 作业详情 */
export function getStudentAssignmentDetail(assignmentId: string): Promise<{
  id: string
  class_id: string
  class_name: string
  teacher_id: string
  title: string
  description: string | null
  subject: string
  content: IAssignmentDetail['content']
  total_score: number | null
  due_date: string
  allow_late_submission: boolean
  status: string
  created_at: string
}> {
  return get(`/api/v1/student/assignments/${assignmentId}`)
}

/** 提交作业 */
export function submitAssignment(
  assignmentId: string,
  data: ISubmissionCreate
): Promise<void> {
  return post(`/api/v1/student/assignments/${assignmentId}/submit`, data)
}

/** 我的提交与批改结果 */
export function getMySubmission(assignmentId: string): Promise<ISubmissionDetail> {
  return get(`/api/v1/student/assignments/${assignmentId}/my-submission`)
}
