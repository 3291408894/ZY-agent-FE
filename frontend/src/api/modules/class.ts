// ================================================================
// 智翼 (ZhiYi) — 班级管理系统 API
// 对应班级管理系统接口文档，含教师端 + 学生端接口
// ================================================================

import { get, post, del, patch } from '../request'
import type {
  IClassItem,
  IClassListData,
  IClassCreateRequest,
  IRosterData,
  IInviteCodeData,
  IArchiveClassData,
  IJoinClassRequest,
  IJoinClassData,
  IStudentClassItem,
  IStudentClassListData,
  IClassExamPaperItem,
  IPaginatedData,
} from '@/types'

// ================================================================
// 教师端接口 (/teacher/classes)
// ================================================================

/** 创建班级 — POST /api/v1/teacher/classes */
export function createClass(data: IClassCreateRequest) {
  return post<IClassItem>('/api/v1/teacher/classes', data)
}

/** 我的班级列表 — GET /api/v1/teacher/classes */
export function getTeacherClasses() {
  return get<IClassListData>('/api/v1/teacher/classes')
}

/** 班级详情 — GET /api/v1/teacher/classes/{classId} */
export function getClassDetail(classId: string) {
  return get<IClassItem>(`/api/v1/teacher/classes/${classId}`)
}

/** 花名册 — GET /api/v1/teacher/classes/{classId}/roster */
export function getClassRoster(classId: string) {
  return get<IRosterData>(`/api/v1/teacher/classes/${classId}/roster`)
}

/** 移除学生 — DELETE /api/v1/teacher/classes/{classId}/students/{studentId} */
export function removeStudent(classId: string, studentId: string) {
  return del<null>(`/api/v1/teacher/classes/${classId}/students/${studentId}`)
}

/** 重新生成邀请码 — POST /api/v1/teacher/classes/{classId}/regenerate-code */
export function regenerateInviteCode(classId: string) {
  return post<IInviteCodeData>(`/api/v1/teacher/classes/${classId}/regenerate-code`)
}

/** 归档班级 — PATCH /api/v1/teacher/classes/{classId}/archive */
export function archiveClass(classId: string) {
  return patch<IArchiveClassData>(`/api/v1/teacher/classes/${classId}/archive`)
}

// ================================================================
// 学生端接口 (/student/classes)
// ================================================================

/** 通过邀请码加入班级 — POST /api/v1/student/classes/join */
export function joinClass(data: IJoinClassRequest) {
  return post<IJoinClassData>('/api/v1/student/classes/join', data)
}

/** 我加入的班级列表 — GET /api/v1/student/classes */
export function getStudentClasses() {
  return get<IStudentClassListData>('/api/v1/student/classes')
}

/** 退出班级 — DELETE /api/v1/student/classes/{classId}/leave */
export function leaveClass(classId: string) {
  return del<null>(`/api/v1/student/classes/${classId}/leave`)
}

// ================================================================
// 班级资源分享 (师生联动)
// ================================================================

/** 教师查看班级已分享资源 — GET /api/v1/teacher/classes/{classId}/resources */
export function getTeacherClassResources(classId: string, params?: { page?: number; page_size?: number }) {
  return get<any>(`/api/v1/teacher/classes/${classId}/resources`, params)
}

/** 学生查看班级共享资源 — GET /api/v1/student/classes/{classId}/resources */
export function getStudentClassResources(classId: string, params?: { page?: number; page_size?: number }) {
  return get<any>(`/api/v1/student/classes/${classId}/resources`, params, { silent: true })
}

/** 学生保存资源到知识库 — POST /api/v1/student/classes/{classId}/resources/{resourceId}/save-to-knowledge */
export function saveResourceToKnowledge(classId: string, resourceId: string) {
  return post<any>(`/api/v1/student/classes/${classId}/resources/${resourceId}/save-to-knowledge`)
}

/** 学生查看班级试卷 — GET /api/v1/student/classes/{classId}/exam-papers */
export function getStudentClassExamPapers(
  classId: string,
  params?: { page?: number; page_size?: number },
): Promise<IPaginatedData<IClassExamPaperItem>> {
  return get<IPaginatedData<IClassExamPaperItem>>(
    `/api/v1/student/classes/${classId}/exam-papers`,
    params,
    { silent: true },
  )
}

/** 学生开始在线作答 — POST /api/v1/student/classes/{classId}/exam-papers/{paperId}/start-answer */
export function startExamAnswer(classId: string, paperId: string): Promise<{ assignment_id: string }> {
  return post<{ assignment_id: string }>(`/api/v1/student/classes/${classId}/exam-papers/${paperId}/start-answer`)
}

/** 学生下载班级试卷 — GET /api/v1/student/classes/{classId}/exam-papers/{paperId}/download */
export async function downloadStudentExamPaper(classId: string, paperId: string): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('access_token')
  const res = await fetch(
    `${base}/api/v1/student/classes/${classId}/exam-papers/${paperId}/download`,
    { headers: { Authorization: `Bearer ${token || ''}` } },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `下载失败 (${res.status})` }))
    throw new Error(err?.detail?.message || err?.message || `下载失败 (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const disposition = res.headers.get('Content-Disposition')
  const match = disposition?.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/)
  a.download = match ? decodeURIComponent(match[1]) : `试卷_${paperId.slice(0, 8)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
