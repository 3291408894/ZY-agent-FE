/** 试卷生成器 API 模块 */

import { get, post, del } from '../request'
import type {
  IExamPaperGenerateRequest,
  IExamPaperItem,
  IExamPaperDetail,
  IExamPaperContent,
  IPaginatedData,
  ExportFormat,
  ISendExamPaperToClassRequest,
  ISendToClassResult,
} from '@/types'

const BASE = '/api/v1/teacher/exam-papers'

/** SSE 流式生成试卷（返回 fetch Response，由 composable 消费） */
export function generateExamPaperSSE(
  body: IExamPaperGenerateRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const token = localStorage.getItem('access_token')
  return fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  })
}

/** 试卷历史列表 */
export function listExamPapers(params: {
  page: number
  page_size: number
  subject?: string
  exam_type?: string
}): Promise<IPaginatedData<IExamPaperItem>> {
  return get<IPaginatedData<IExamPaperItem>>(BASE, params)
}

/** 试卷详情 */
export function getExamPaperDetail(id: string): Promise<IExamPaperDetail> {
  return get<IExamPaperDetail>(`${BASE}/${id}`)
}

/** 删除试卷 */
export function deleteExamPaper(id: string): Promise<void> {
  return del<void>(`${BASE}/${id}`)
}

/** 导出试卷（返回下载文件 blob） */
export async function exportExamPaper(
  id: string,
  format: ExportFormat = 'word',
): Promise<Blob> {
  const token = localStorage.getItem('access_token')
  const resp = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || ''}${BASE}/${id}/export`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ format }),
    },
  )
  if (!resp.ok) throw new Error('导出失败')
  return resp.blob()
}

/** 发送试卷到班级 */
export function sendExamPaperToClass(
  paperId: string,
  data: ISendExamPaperToClassRequest,
): Promise<ISendToClassResult> {
  return post<ISendToClassResult>(`${BASE}/${paperId}/send-to-class`, data)
}
