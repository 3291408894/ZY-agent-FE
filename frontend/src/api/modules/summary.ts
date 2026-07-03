// ================================================================
// 智翼 (ZhiYi) — 课文总结模块 API
// 对应 PBI_06 接口
// ================================================================

import { get, del } from '../request'
import type { IPaginationParams } from '../types'
import type { ISummaryRecord } from '@/types'

/** 获取总结历史列表 */
export function getSummaryHistory(params?: IPaginationParams) {
  return get<ISummaryRecord[]>('/api/v1/summaries', params)
}

/** 查看总结详情 */
export function getSummaryDetail(id: string) {
  return get<ISummaryRecord>(`/api/v1/summaries/${id}`)
}

/** 删除总结记录 */
export function deleteSummary(id: string) {
  return del(`/api/v1/summaries/${id}`)
}

// 注意：POST /summaries/generate 使用 SSE 流式传输
// 请使用 useSSE() composable 发起请求
