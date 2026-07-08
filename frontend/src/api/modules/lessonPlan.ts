/** 智能教案生成模块 — API 请求层 (PBI_LP) */

import { get, del } from '../request'
import type {
  IPaginatedData,
  ILessonPlanItem,
  ILessonPlanDetail,
  ILessonPlanListQuery,
} from '@/types'

/**
 * 获取历史教案列表（分页）
 * GET /api/v1/lesson-plans
 */
export function getLessonPlanList(params: ILessonPlanListQuery) {
  return get<IPaginatedData<ILessonPlanItem>>('/api/v1/lesson-plans', params)
}

/**
 * 查看单条教案详情
 * GET /api/v1/lesson-plans/{id}
 */
export function getLessonPlanDetail(id: string) {
  return get<ILessonPlanDetail>(`/api/v1/lesson-plans/${id}`)
}

/**
 * 删除教案记录
 * DELETE /api/v1/lesson-plans/{id}
 */
export function deleteLessonPlan(id: string) {
  return del<{ code: number; message: string }>(`/api/v1/lesson-plans/${id}`)
}

/**
 * 获取 SSE 流式接口的完整 URL
 * （供 useSSE composable 使用）
 */
export function getLessonPlanGenerateUrl(): string {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseURL}/api/v1/lesson-plans/generate`
}
