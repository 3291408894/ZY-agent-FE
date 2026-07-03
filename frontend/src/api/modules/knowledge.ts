// ================================================================
// 智翼 (ZhiYi) — 知识图谱模块 API
// 对应 PBI_11 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type { IKnowledgeGraph, IKnowledgeNode } from '@/types'

/** 生成知识图谱 */
export function generateGraph(body: {
  source_type: 'subject' | 'chapter' | 'file'
  source: string
  file_id?: string | null
}) {
  return post<IKnowledgeGraph>('/api/v1/knowledge/graph', body)
}

/** 获取图谱列表 */
export function getGraphList(params?: IPaginationParams) {
  return get<IKnowledgeGraph[]>('/api/v1/knowledge/graphs', params)
}

/** 查看图谱详情 */
export function getGraphDetail(graphId: string) {
  return get<IKnowledgeGraph>(`/api/v1/knowledge/graphs/${graphId}`)
}

/** 获取节点详情（知识点、例题、易错点） */
export function getNodeDetail(graphId: string, nodeId: string) {
  return get<IKnowledgeNode>(
    `/api/v1/knowledge/graphs/${graphId}/node/${nodeId}`
  )
}

/** 删除图谱 */
export function deleteGraph(graphId: string) {
  return del(`/api/v1/knowledge/graphs/${graphId}`)
}

/** 导出图谱为图片 */
export function exportGraph(graphId: string) {
  return post<{ url: string }>(
    `/api/v1/knowledge/graphs/${graphId}/export`
  )
}
