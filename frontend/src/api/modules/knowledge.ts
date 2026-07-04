// ================================================================
// 智翼 (ZhiYi) — 知识图谱 API 模块 (PBI_11)
// 对应后端 app/api/v1/knowledge.py & 接口文档 §5.6
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type {
  IKnowledgeGraph,
  IKnowledgeGraphItem,
  IKnowledgeNode,
} from '@/types'

// ── 5.6 知识图谱模块 ──

/** POST /knowledge/graph — 生成知识图谱 */
export function generateGraph(params: {
  source_type: 'subject' | 'chapter' | 'file'
  source: string
  file_id?: string | null
}): Promise<IKnowledgeGraph> {
  return post('/api/v1/knowledge/graph', params)
}

/** GET /knowledge/graphs — 图谱列表（分页） */
export function getGraphList(
  params?: IPaginationParams
): Promise<{ items: IKnowledgeGraphItem[]; total: number; page: number; page_size: number; total_pages: number }> {
  return get('/api/v1/knowledge/graphs', params)
}

/** GET /knowledge/graphs/{graph_id} — 查看图谱详情 */
export function getGraphDetail(graphId: string): Promise<IKnowledgeGraph> {
  return get(`/api/v1/knowledge/graphs/${graphId}`)
}

/** GET /knowledge/graphs/{graph_id}/node/{node_id} — 节点详情 */
export function getNodeDetail(
  graphId: string,
  nodeId: string
): Promise<IKnowledgeNode> {
  return get(`/api/v1/knowledge/graphs/${graphId}/node/${nodeId}`)
}

/** DELETE /knowledge/graphs/{graph_id} — 删除图谱 */
export function deleteGraph(graphId: string): Promise<void> {
  return del(`/api/v1/knowledge/graphs/${graphId}`)
}

/** POST /knowledge/graphs/{graph_id}/export — 导出为图片 */
export function exportGraph(graphId: string): Promise<{ url: string }> {
  return post(`/api/v1/knowledge/graphs/${graphId}/export`)
}
