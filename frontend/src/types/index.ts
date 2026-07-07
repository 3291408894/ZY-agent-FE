/** 智翼平台 — 全局 TypeScript 类型定义（与后端 Pydantic Schema 对齐） */

// ═══════════════════════════════════════════════════════════
// 用户 & 认证 (PBI_01)
// ═══════════════════════════════════════════════════════════

export interface IRegisterRequest {
  email: string
  phone?: string
  password: string
  grade: string
  subjects: string[]
}

export interface ILoginRequest {
  login: string
  password: string
}

/** 通用 API 响应 */
export interface IApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页数据 */
export interface IPaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ═══════════════════════════════════════════════════════════
// 用户角色类型
// ═══════════════════════════════════════════════════════════

export type UserRole = 'student' | 'teacher' | 'admin'

/** 用户简要信息（登录响应 / Store 轻量存储） */
export interface IUserBrief {
  id: string
  email: string | null
  phone: string | null
  nickname: string
  role: UserRole
  grade: string | null
  subjects: string[]
  textbook_version: string | null
  avatar_url: string | null
  created_at?: string
}

/** 用户完整档案 */
export interface IUserProfile extends IUserBrief {
  created_at: string
  updated_at: string
}

/** 更新档案请求 */
export interface IUpdateProfileRequest {
  nickname?: string
  grade?: string
  subjects?: string[]
  textbook_version?: string
}

/** 仪表盘数据 */
export interface IDashboardData {
  total_study_time: number
  total_exercises: number
  correct_rate: number
  recent_summaries: ISummaryItem[]
  recent_exercises: any[]
  recommendations: any[]
  weak_points: string[]
}

// ═══════════════════════════════════════════════════════════
// 课文总结 (PBI_06)
// ═══════════════════════════════════════════════════════════

export type SummaryMode = 'brief' | 'detailed'
export type SummarySourceType = 'text' | 'file'

export interface IKnowledgePoint {
  name: string
  category: string
}

export interface IGenerateSummaryRequest {
  source_type: SummarySourceType
  content: string
  mode: SummaryMode
  file_id?: string | null
}

export interface ISummaryItem {
  id: string
  source_type: SummarySourceType
  source_content: string
  summary_text: string
  mode: SummaryMode
  knowledge_points: IKnowledgePoint[]
  created_at: string
}

export interface ISummaryDetail {
  id: string
  source_type: SummarySourceType
  source_content: string
  summary_text: string
  mode: SummaryMode
  knowledge_points: IKnowledgePoint[]
  created_at: string
}

export interface ISummaryListQuery {
  page: number
  page_size: number
  mode?: SummaryMode
}

// ═══════════════════════════════════════════════════════════
// AI Agent (PBI_04, PBI_12)
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
  result_summary?: string
}

// ═══════════════════════════════════════════════════════════
// 文件管理 (PBI_05)
// ═══════════════════════════════════════════════════════════

export type FileType = 'txt' | 'md' | 'pdf' | 'docx' | 'csv' | 'json' | 'html' | 'xml' | 'yaml'
export type ParseStatus = 'pending' | 'processing' | 'done' | 'failed'

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

// ═══════════════════════════════════════════════════════════
// 习题 (PBI_08, PBI_09, PBI_10)
// ═══════════════════════════════════════════════════════════

export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'choice' | 'fill' | 'short_answer' | 'calculation' | 'analysis'
export type ExerciseMode = 'practice' | 'review'

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

export interface IGradedItem {
  exercise_id: string
  is_correct: boolean
  score: number
  correct_answer: string
  analysis: string
  error_reason?: string | null
  related_knowledge: string[]
}

export interface IGradeResult {
  total_score: number
  correct_count: number
  total_count: number
  results: IGradedItem[]
}

export interface IExerciseBatch {
  id: string
  exercises: IExercise[]
  grade_result?: IGradeResult
  created_at: string
}

// ═══════════════════════════════════════════════════════════
// 知识图谱 (PBI_11)
// ═══════════════════════════════════════════════════════════

export interface IGraphNode {
  id: string
  label: string
  type: 'category' | 'article' | 'knowledge'
  x: number
  y: number
}

export interface IGraphEdge {
  source: string
  target: string
  relation: string
}

export interface IKnowledgeGraph {
  graph_id: string
  title: string
  source_type?: string
  nodes: IGraphNode[]
  edges: IGraphEdge[]
}

export interface IKnowledgeGraphItem {
  id: string
  title: string
  node_count: number
  edge_count: number
  source_type: string
  created_at: string
}

export interface IKnowledgeNode {
  node_id: string
  label: string
  description: string
  examples: string[]
  common_mistakes: string[]
  related_nodes: Array<{ id: string; label: string; relation: string }>
}

// ═══════════════════════════════════════════════════════════
// SSE 流式事件
// ═══════════════════════════════════════════════════════════

export interface ISSEContentEvent {
  type: 'content'
  chunk: string
}

export interface ISSEKnowledgePointsEvent {
  type: 'knowledge_points'
  points: IKnowledgePoint[]
}

export interface ISSEDoneEvent {
  type: 'done'
  summary_id: string
  mode: SummaryMode
}

export interface ISSEErrorEvent {
  type: 'error'
  message: string
}

export type SSESummaryEvent =
  | ISSEContentEvent
  | ISSEKnowledgePointsEvent
  | ISSEDoneEvent
  | ISSEErrorEvent

// ═══════════════════════════════════════════════════════════
// 班级管理系统 (PBI: 班级管理)
// ═══════════════════════════════════════════════════════════

export type ClassStatus = 'active' | 'archived'

/** 班级信息 */
export interface IClassItem {
  id: string
  name: string
  grade: string
  subject: string
  description: string | null
  invite_code: string
  student_count: number
  status: ClassStatus
  created_at: string
  updated_at: string
}

/** 班级列表响应 */
export interface IClassListData {
  classes: IClassItem[]
}

/** 创建班级请求 */
export interface IClassCreateRequest {
  name: string
  grade: string
  subject: string
  description?: string
}

/** 花名册学生条目 */
export interface IRosterStudent {
  id: string
  student_id: string
  student_name: string
  joined_at: string
}

/** 花名册响应 */
export interface IRosterData {
  roster: IRosterStudent[]
}

/** 重新生成邀请码响应 */
export interface IInviteCodeData {
  invite_code: string
}

/** 归档班级响应 */
export interface IArchiveClassData {
  status: 'archived'
}

/** 加入班级请求 */
export interface IJoinClassRequest {
  invite_code: string
}

/** 加入班级响应 */
export interface IJoinClassData {
  success: boolean
  class_id: string
  class_name: string
}

/** 学生端班级信息（不含邀请码） */
export interface IStudentClassItem {
  id: string
  name: string
  grade: string
  subject: string
  description: string | null
  status: ClassStatus
  joined_at: string
}

/** 学生端班级列表响应 */
export interface IStudentClassListData {
  classes: IStudentClassItem[]
}
