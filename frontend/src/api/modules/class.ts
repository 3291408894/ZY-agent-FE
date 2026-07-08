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
  return get<any>(`/api/v1/student/classes/${classId}/resources`, params)
}

/** 学生保存资源到知识库 — POST /api/v1/student/classes/{classId}/resources/{resourceId}/save-to-knowledge */
export function saveResourceToKnowledge(classId: string, resourceId: string) {
  return post<any>(`/api/v1/student/classes/${classId}/resources/${resourceId}/save-to-knowledge`)
}
