// ================================================================
// 智翼 (ZhiYi) — 习题模块 API
// 对应 PBI_08/PBI_09/PBI_10 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type { IGradeResult, IExerciseBatch } from '@/types'
import type { Difficulty, QuestionType } from '@/types'

// ================================================================
// 习题生成请求参数
// ================================================================

/** 出题配置 */
export interface IGenerateExerciseParams {
  subject: string
  grade: string
  knowledge_points: string[]
  difficulty: Difficulty
  question_types: QuestionType[]
  count: number
  mode: string  // 'practice' | 'review'
}

/** 构建 SSE 生成请求的 url + body（SSE 不走 Axios，使用 useSSE composable） */
export function buildGenerateRequest(config: IGenerateExerciseParams) {
  return {
    url: '/api/v1/exercises/generate',
    body: {
      subject: config.subject,
      grade: config.grade,
      knowledge_points: config.knowledge_points,
      difficulty: config.difficulty,
      question_types: config.question_types,
      count: config.count,
      mode: config.mode,
    },
  }
}

// ================================================================
// REST 接口
// ================================================================

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
