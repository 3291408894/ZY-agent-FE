// ================================================================
// 智翼 (ZhiYi) — 习题模块 API
// 对应 PBI_08/PBI_09/PBI_10 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type { IGradeResult, IExerciseBatch } from '@/types'

/** 提交作答并获取批改结果 */
export function submitAnswers(body: {
  batch_id: string
  answers: Array<{ exercise_id: string; user_answer: string }>
}) {
  return post<IGradeResult>('/api/v1/exercises/grade', body)
}

/** 获取做题历史 */
export function getExerciseHistory(params?: IPaginationParams) {
  return get('/api/v1/exercises/history', params)
}

/** 获取单次练习详情 */
export function getExerciseBatch(batchId: string) {
  return get<IExerciseBatch>(`/api/v1/exercises/batches/${batchId}`)
}

/** 删除练习记录 */
export function deleteExerciseBatch(batchId: string) {
  return del(`/api/v1/exercises/batches/${batchId}`)
}

// 注意：POST /exercises/generate 使用 SSE 流式传输
// 请使用 useSSE() composable 发起请求
