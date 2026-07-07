// ================================================================
// 智翼 (ZhiYi) — AI Agent 模块 API
// 对应 PBI_04/PBI_12 接口
// 与 AI Agent会话历史接口文档.md 对齐
// ================================================================

import { get, patch, del } from '../request'
import type {
  ISessionsResponse,
  ISessionDetail,
} from '@/types'

// ── 会话管理 ──

/** 获取会话列表（按日期分组）— GET /agent/sessions */
export function getSessions() {
  return get<ISessionsResponse>('/api/v1/agent/sessions')
}

/** 获取会话历史消息 — GET /agent/sessions/{session_id} */
export function getSessionMessages(sessionId: string) {
  return get<ISessionDetail>(`/api/v1/agent/sessions/${sessionId}`)
}

/** 修改会话标题 — PATCH /agent/sessions/{session_id}/title */
export function updateSessionTitle(sessionId: string, title: string) {
  return patch<{ id: string; title: string }>(
    `/api/v1/agent/sessions/${sessionId}/title`,
    { title }
  )
}

/** 删除会话 — DELETE /agent/sessions/{session_id} */
export function deleteSession(sessionId: string) {
  return del(`/api/v1/agent/sessions/${sessionId}`)
}

// 注意：POST /agent/chat 使用 SSE 流式传输，不走 Axios
// 请使用 useSSE() composable 发起请求
