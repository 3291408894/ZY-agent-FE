// ================================================================
// 智翼 (ZhiYi) — 认证模块 API
// 对应 PBI_01 接口：POST /auth/register, POST /auth/login ...
// ================================================================

import { post, get, put } from '../request'
import type { ILoginRequest, IRegisterRequest, ILoginResponse, IResetPasswordRequest } from '@/types'

// ── 注册 ──
export function register(data: IRegisterRequest) {
  return post<{ user_id: string; email: string; grade: string }>(
    '/api/v1/auth/register',
    data
  )
}

// ── 登录 ──
export function login(data: ILoginRequest) {
  return post<ILoginResponse>('/api/v1/auth/login', data)
}

// ── 找回密码 ──
export function resetPassword(data: IResetPasswordRequest) {
  return post('/api/v1/auth/reset-password', data)
}

// ── 发送验证码 ──
export function sendVerificationCode(email: string) {
  return post('/api/v1/auth/reset-password/verify', { email })
}

// ── 刷新 Token ──
export function refreshToken(refreshToken: string) {
  return post<{ access_token: string; expires_in: number }>(
    '/api/v1/auth/refresh',
    { refresh_token: refreshToken }
  )
}

// ── 获取用户资料 ──
export function getUserProfile() {
  return get('/api/v1/users/profile')
}

// ── 更新用户资料 ──
export function updateUserProfile(data: Record<string, any>) {
  return put('/api/v1/users/profile', data)
}

// ── 获取仪表盘数据 ──
export function getDashboard() {
  return get('/api/v1/users/dashboard')
}
