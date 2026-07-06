/** 课文总结模块 — API 请求层 (PBI_06) */

import { get, post, del } from '../request'
import type {
  IApiResponse,
  IPaginatedData,
  ISummaryItem,
  ISummaryDetail,
  ISummaryListQuery,
  SummaryMode,
} from '@/types'

/**
 * 获取历史总结列表（分页）
 * GET /api/v1/summaries
 */
export function getSummaryList(params: ISummaryListQuery) {
  return get<IPaginatedData<ISummaryItem>>('/api/v1/summaries', params)
}

/**
 * 查看单条总结详情
 * GET /api/v1/summaries/{id}
 */
export function getSummaryDetail(id: string) {
  return get<ISummaryDetail>(`/api/v1/summaries/${id}`)
}

/**
 * 删除总结记录
 * DELETE /api/v1/summaries/{id}
 */
export function deleteSummary(id: string) {
  return del<{ code: number; message: string }>(`/api/v1/summaries/${id}`)
}

/**
 * 获取 SSE 流式接口的完整 URL
 * （供 useSSE composable 使用）
 */
export function getSummaryGenerateUrl(): string {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseURL}/api/v1/summaries/generate`
}

/**
 * 简易模式标签映射
 */
export const SUMMARY_MODE_LABELS: Record<SummaryMode, string> = {
  brief: '精简版',
  detailed: '详细版',
}

export const SUMMARY_MODE_DESCRIPTIONS: Record<SummaryMode, string> = {
  brief: '包含全文主旨 + 段落概要',
  detailed: '包含主旨 + 段落精析 + 考点 + 写作手法 + 学习启示',
}
