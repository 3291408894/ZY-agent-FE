/**
 * 班级管理 API 模块 (功能4) — 教师端 + 学生端
 */

import { get, post, del } from '../request'
import type {
  IClassCreate,
  IClassItem,
  IClassDetail,
  IClassRoster,
  IJoinClassInfo,
  IStudentClassItem,
} from '@/types'

// ═══════════════════════════════════════════════════
// 教师端
// ═══════════════════════════════════════════════════

/** 创建班级 */
export function createClass(data: IClassCreate): Promise<IClassItem> {
  return post('/api/v1/teacher/classes', data)
}

/** 教师班级列表 */
export function getTeacherClasses(params?: {
  page?: number
  page_size?: number
  status?: string
}): Promise<{ items: IClassItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get('/api/v1/teacher/classes', params)
}

/** 班级详情（含花名册） */
export function getClassDetail(classId: string): Promise<IClassDetail> {
  return get(`/api/v1/teacher/classes/${classId}`)
}

/** 花名册 */
export function getRoster(classId: string): Promise<IClassRoster> {
  return get(`/api/v1/teacher/classes/${classId}/roster`)
}

/** 移除学生 */
export function removeStudent(classId: string, studentId: string): Promise<void> {
  return del(`/api/v1/teacher/classes/${classId}/students/${studentId}`)
}

/** 重新生成邀请码 */
export function regenerateInviteCode(classId: string): Promise<{ invite_code: string }> {
  return post(`/api/v1/teacher/classes/${classId}/regenerate-code`)
}

/** 归档班级 */
export function archiveClass(classId: string): Promise<void> {
  return post(`/api/v1/teacher/classes/${classId}/archive`)
}

// ═══════════════════════════════════════════════════
// 学生端
// ═══════════════════════════════════════════════════

/** 查询邀请码信息 */
export function checkInviteCode(inviteCode: string): Promise<IJoinClassInfo> {
  return get(`/api/v1/student/classes/check-invite/${inviteCode}`)
}

/** 通过邀请码加入班级 */
export function joinClass(inviteCode: string): Promise<IJoinClassInfo> {
  return post('/api/v1/student/classes/join', { invite_code: inviteCode })
}

/** 我的班级列表 */
export function getMyClasses(params?: {
  page?: number
  page_size?: number
}): Promise<{ items: IStudentClassItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get('/api/v1/student/classes', params)
}

/** 退出班级 */
export function leaveClass(classId: string): Promise<void> {
  return del(`/api/v1/student/classes/${classId}/leave`)
}
