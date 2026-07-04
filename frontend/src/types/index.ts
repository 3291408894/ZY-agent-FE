/** 智翼平台 — 全局 TypeScript 类型定义（与后端 Pydantic Schema 对齐） */

// ═══════════════════════════════════════════════════════════
// 基础 & 通用
// ═══════════════════════════════════════════════════════════

export interface IApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface IPaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ═══════════════════════════════════════════════════════════
// 课文总结模块 (PBI_06)
// ═══════════════════════════════════════════════════════════

/** 总结模式 */
export type SummaryMode = 'brief' | 'detailed'

/** 总结来源类型 */
export type SummarySourceType = 'text' | 'file'

/** 知识点 */
export interface IKnowledgePoint {
  name: string
  category: string
}

/** 发起总结请求 */
export interface IGenerateSummaryRequest {
  source_type: SummarySourceType
  content: string
  mode: SummaryMode
  file_id?: string | null
}

/** 总结列表项 */
export interface ISummaryItem {
  id: string
  source_type: SummarySourceType
  source_content: string   // 截断展示
  summary_text: string     // 截断展示
  mode: SummaryMode
  knowledge_points: IKnowledgePoint[]
  created_at: string
}

/** 总结详情 */
export interface ISummaryDetail {
  id: string
  source_type: SummarySourceType
  source_content: string   // 完整原文
  summary_text: string     // 完整总结
  mode: SummaryMode
  knowledge_points: IKnowledgePoint[]
  created_at: string
}

/** 历史列表查询参数 */
export interface ISummaryListQuery {
  page: number
  page_size: number
  mode?: SummaryMode
}

// ═══════════════════════════════════════════════════════════
// SSE 流式事件类型
// ═══════════════════════════════════════════════════════════

/** SSE: 总结内容增量 */
export interface ISSEContentEvent {
  type: 'content'
  chunk: string
}

/** SSE: 知识点提取完成 */
export interface ISSEKnowledgePointsEvent {
  type: 'knowledge_points'
  points: IKnowledgePoint[]
}

/** SSE: 总结完成 */
export interface ISSEDoneEvent {
  type: 'done'
  summary_id: string
  mode: SummaryMode
}

/** SSE: 错误 */
export interface ISSEErrorEvent {
  type: 'error'
  message: string
}

/** SSE 联合类型 */
export type SSESummaryEvent =
  | ISSEContentEvent
  | ISSEKnowledgePointsEvent
  | ISSEDoneEvent
  | ISSEErrorEvent

// ═══════════════════════════════════════════════════════════
// AI Agent 模块 (PBI_04, PBI_12)
// ═══════════════════════════════════════════════════════════

export interface IChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface IChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  thought_chain?: IThoughtStep[]
  tool_calls?: IToolCall[]
  created_at: string
}

export interface IThoughtStep {
  step: number
  title: string
  content: string
}

export interface IToolCall {
  tool_name: string
  parameters: Record<string, unknown>
  result?: string
}

// ═══════════════════════════════════════════════════════════
// 通用枚举
// ═══════════════════════════════════════════════════════════

export type Difficulty = 'easy' | 'medium' | 'hard'

export type QuestionType = 'choice' | 'fill' | 'short_answer' | 'calculation' | 'analysis'

export type FileType = 'txt' | 'md' | 'pdf' | 'docx' | 'csv' | 'json' | 'html' | 'xml' | 'yaml'

export type ParseStatus = 'pending' | 'processing' | 'done' | 'failed'
