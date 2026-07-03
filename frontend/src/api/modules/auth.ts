// ================================================================
// 智翼 (ZhiYi) — 认证模块 API
// 对应 PBI_01，与 认证模块接口说明书.md 对齐
// ================================================================

import { post, get, put } from '../request'
import type {
  IRegisterRequest,
  ILoginRequest,
  IUpdateProfileRequest,
  IUserProfile,
  IDashboardData,
} from '@/types'

// ================================================================
// 认证接口（/auth）— 无需登录态
// ================================================================

/** 用户注册 — POST /api/v1/auth/register */
export function register(data: IRegisterRequest) {
  return post<{ user_id: string; email: string | null; grade: string }>(
    '/api/v1/auth/register',
    data
  )
}

/** 用户登录 — POST /api/v1/auth/login */
export function login(data: ILoginRequest) {
  return post<{
    access_token: string
    token_type: 'bearer'
    expires_in: number
    user: {
      id: string
      email: string | null
      phone: string | null
      nickname: string
      grade: string | null
      subjects: string[]
      textbook_version: string | null
      avatar_url: string | null
    }
  }>('/api/v1/auth/login', data)
}

/** 发送重置密码验证码 — POST /api/v1/auth/reset-password */
export function sendResetCode(email: string) {
  return post<null>('/api/v1/auth/reset-password', { email })
}

/** 验证并重置密码 — POST /api/v1/auth/reset-password/verify */
export function resetPassword(data: {
  email: string
  code: string
  new_password: string
}) {
  return post<null>('/api/v1/auth/reset-password/verify', data)
}

// ================================================================
// 用户接口（/users）— 需登录态
// ================================================================

/** 获取个人资料 — GET /api/v1/users/profile */
export function getProfile() {
  return get<IUserProfile>('/api/v1/users/profile')
}

/** 更新个人资料 — PUT /api/v1/users/profile */
export function updateProfile(data: IUpdateProfileRequest) {
  return put<IUserProfile>('/api/v1/users/profile', data)
}

/** 获取学习仪表盘 — GET /api/v1/users/dashboard */
export function getDashboard() {
  return get<IDashboardData>('/api/v1/users/dashboard')
}
