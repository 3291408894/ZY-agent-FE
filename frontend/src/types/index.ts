// ================================================================
// 智翼 (ZhiYi) — 全局 TypeScript 类型定义
// 与后端 Pydantic Schema 对齐（文档第五、六章）
// ================================================================

// ================================================================
// 用户 & 认证（PBI_01）
// 与 认证模块接口说明书.md 对齐
// ================================================================

/** 注册请求 */
export interface IRegisterRequest {
  email: string | null       // 邮箱（与 phone 至少填一个）
  phone: string | null       // 手机号（与 email 至少填一个）
  password: string           // 密码，8-64 位
  grade: string              // 年级，如 "七年级"（必填）
  subjects: string[]         // 学科偏好列表，默认 []
}

/** 登录请求 */
export interface ILoginRequest {
  login: string              // 邮箱或手机号
  password: string           // 密码
}

/** 登录响应 */
export interface ILoginResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number         // Token 有效时长（秒），86400 = 24小时
  user: IUserBrief
}

/** 重置密码 — 发送验证码 */
export interface ISendResetCodeRequest {
  email: string
}

/** 重置密码 — 验证并重置 */
export interface IResetPasswordRequest {
  email: string
  code: string
  new_password: string
}

/** 用户简要信息（登录响应中的 user 字段） */
export interface IUserBrief {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  grade: string | null
  subjects: string[]
  textbook_version: string | null
  avatar_url: string | null
}

/** 用户完整资料（/users/profile 返回） */
export interface IUserProfile {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  grade: string | null
  subjects: string[]
  textbook_version: string | null
  avatar_url: string | null
  created_at: string         // ISO 8601 时间字符串
}

/** 更新资料请求（所有字段可选，只传要修改的） */
export interface IUpdateProfileRequest {
  nickname?: string
  grade?: string
  subjects?: string[]
  textbook_version?: string
}

/** 学习档案 */
export interface ILearningProfile {
  id: string
  user_id: string
  total_study_time: number   // 秒
  total_exercises: number
  correct_rate: number
  weak_points: string[]
  updated_at: string
}

/** 仪表盘数据 */
export interface IDashboardData {
  total_study_time: number    // 累计学习时长（秒）
  total_exercises: number     // 累计做题数
  correct_rate: number        // 正确率 (0.0 ~ 1.0)
  recent_summaries: unknown[] // 近期总结列表（Sprint 1 前期为空数组）
  recent_exercises: unknown[] // 近期习题列表（Sprint 1 前期为空数组）
  recommendations: unknown[]  // 推荐内容（Sprint 1 前期为空数组）
  weak_points: string[]       // 薄弱知识点
}

// ================================================================
// AI Agent（PBI_04, PBI_12）
// ================================================================

/** 对话会话 */
export interface IChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

/** 对话消息 */
export interface IChatMessage {
  id: string | number
  session_id: string
  role: 'user' | 'assistant'
  content: string
  thought_chain?: IThoughtStep[] | null
  tool_calls?: IToolCall[] | null
  created_at: string
}

/** 思考链步骤（PBI_12）
 *  - SSE thought 事件使用 `content` 字段
 *  - REST API 历史消息使用 `description` 字段
 *  前端统一通过 `content` 字段读取，`description` 自动映射 */
export interface IThoughtStep {
  step: number
  title: string
  content: string
  description?: string
}

/** 工具调用记录（PBI_12） */
export interface IToolCall {
  tool_name: string
  parameters: Record<string, any>
  result_summary?: string
}

/** 会话列表（按日期分组）— GET /agent/sessions 返回 */
export interface ISessionGroup {
  label: string // "今天" | "昨天" | "本周" | "更早"
  sessions: IChatSession[]
}

/** 会话列表响应 */
export interface ISessionsResponse {
  groups: ISessionGroup[]
}

/** 会话详情（含历史消息）— GET /agent/sessions/{id} 返回 */
export interface ISessionDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: IChatMessage[]
}

// ================================================================
// 课文总结（PBI_06）
// ================================================================

/** 总结模式 */
export type SummaryMode = 'brief' | 'detailed'

/** 总结来源类型 */
export type SummarySourceType = 'text' | 'file'

/** 课文总结记录 */
export interface ISummaryRecord {
  id: string
  user_id: string
  source_type: SummarySourceType
  source_content: string
  summary_text: string
  mode: SummaryMode
  knowledge_points: string[]
  created_at: string
}

// ================================================================
// 文件管理（PBI_05）
// ================================================================

/** 文件类型 */
export type FileType =
  | 'txt'
  | 'md'
  | 'pdf'
  | 'docx'
  | 'csv'
  | 'json'
  | 'html'
  | 'xml'
  | 'yaml'

/** 解析状态 */
export type ParseStatus = 'pending' | 'processing' | 'done' | 'failed'

/** 上传文件 */
export interface IUploadedFile {
  id: string
  user_id: string
  filename: string
  file_type: FileType
  file_size: number
  storage_path: string
  parse_status: ParseStatus
  parsed_content?: string
  summary?: string
  knowledge_points?: string[]
  created_at: string
}

// ================================================================
// 习题（PBI_08, PBI_09, PBI_10）
// ================================================================

/** 难度等级 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** 题目类型 */
export type QuestionType = 'choice' | 'fill' | 'short_answer' | 'calculation' | 'analysis'

/** 习题模式 */
export type ExerciseMode = 'practice' | 'review'

/** 习题 */
export interface IExercise {
  id: string
  question: string
  question_type: QuestionType
  options?: string[]
  answer?: string | null
  analysis?: string | null
  difficulty: Difficulty
  knowledge_points: string[]
  subject: string
  grade: string
}

/** 批改结果 - 单题 */
export interface IGradedItem {
  exercise_id: string
  is_correct: boolean
  score: number
  correct_answer: string
  analysis: string
  error_reason?: string | null
  related_knowledge: string[]
}

/** 批改结果 - 整体 */
export interface IGradeResult {
  total_score: number
  correct_count: number
  total_count: number
  results: IGradedItem[]
}

/** 习题批次 */
export interface IExerciseBatch {
  id: string
  exercises: IExercise[]
  grade_result?: IGradeResult
  created_at: string
}

// ================================================================
// 知识图谱（PBI_11）
// ================================================================

/** 图谱节点 */
export interface IGraphNode {
  id: string
  label: string
  type: 'category' | 'article' | 'knowledge'
  x: number
  y: number
}

/** 图谱边 */
export interface IGraphEdge {
  source: string
  target: string
  relation: string
}

/** 知识图谱 */
export interface IKnowledgeGraph {
  graph_id: string
  title: string
  nodes: IGraphNode[]
  edges: IGraphEdge[]
}

/** 知识节点详情 */
export interface IKnowledgeNode {
  node_id: string
  label: string
  description: string
  examples: string[]
  common_mistakes: string[]
  related_nodes: Array<{ id: string; label: string; relation: string }>
}

// ================================================================
// 通用工具类型
// ================================================================

/** 可空类型 */
export type Nullable<T> = T | null

/** 可选字段 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** 深度只读 */
export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
