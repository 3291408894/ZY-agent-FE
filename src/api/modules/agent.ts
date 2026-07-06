// ================================================================
// 智翼 (ZhiYi) — AI Agent 模块 API
// 对应 PBI_04/PBI_12 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type { IChatSession, IChatMessage } from '@/types'

// ── 会话管理 ──

/** 获取会话列表 */
export function getSessions(params?: IPaginationParams) {
  return get<IChatSession[]>('/api/v1/agent/sessions', params)
}

/** 获取会话历史消息 */
export function getSessionMessages(sessionId: string) {
  return get<IChatMessage[]>(`/api/v1/agent/sessions/${sessionId}`)
}

/** 删除会话 */
export function deleteSession(sessionId: string) {
  return del(`/api/v1/agent/sessions/${sessionId}`)
}

// 注意：POST /agent/chat 使用 SSE 流式传输，不走 Axios
// 请使用 useSSE() composable 发起请求
