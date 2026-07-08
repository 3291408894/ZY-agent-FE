/** 智翼平台 — 全局 TypeScript 类型定义（与后端 Pydantic Schema 对齐） */

// ═══════════════════════════════════════════════════════════
// 用户 & 认证 (PBI_01)
// ═══════════════════════════════════════════════════════════

export type UserRole = 'student' | 'teacher' | 'admin'

export interface IRegisterRequest {
  email: string
  phone?: string
  password: string
  role?: UserRole
  grade?: string
  subjects?: string[]
  textbook_version?: string
  school_name?: string
  bio?: string
  nickname?: string
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
  school_name: string | null
  bio: string | null
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
  school_name?: string
  bio?: string
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
  teacher_id: string
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

/** 班级列表响应（教师端） */
export interface IClassListData {
  items: IClassItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
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

/** 花名册响应（后端实际用 students 字段） */
export interface IRosterData {
  students?: IRosterStudent[]
  roster?: IRosterStudent[]
  items?: IRosterStudent[]
  class_id?: string
  class_name?: string
  student_count?: number
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

export interface IClassStudent {
  id: string
  student_id: string
  nickname: string
  avatar_url: string | null
  joined_at: string
}

export interface IClassDetail extends IClassItem {
  students: IClassStudent[]
}

export interface IClassRoster {
  class_id: string
  class_name: string
  student_count: number
  students: IClassStudent[]
}

export interface IJoinClassInfo {
  class_id: string
  class_name: string
  teacher_name: string
  subject: string
  grade: string
}

/** 学生端班级信息（不含邀请码） */
export interface IStudentClassItem {
  id: string
  name: string
  grade: string
  subject: string
  description: string | null
  status: ClassStatus
  teacher_name?: string
  student_count?: number
  joined_at: string
}

/** 学生端班级列表响应 */
export interface IStudentClassListData {
  items: IStudentClassItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ═══════════════════════════════════════════════════════════
// 作业管理 (功能5)
// ═══════════════════════════════════════════════════════════

export interface IAssignmentQuestion {
  number: number
  stem: string
  options?: string[]
  answer: string
  score: number
  explanation?: string | null
  scoring_rubric?: string | null
}

export interface IAssignmentSection {
  type: 'objective' | 'subjective'
  title: string
  questions: IAssignmentQuestion[]
}

export interface IAssignmentContent {
  format: 'mixed' | 'objective_only' | 'subjective_only'
  sections: IAssignmentSection[]
}

export interface IAssignmentCreate {
  class_id: string
  title: string
  description?: string | null
  subject: string
  content: IAssignmentContent
  total_score?: number | null
  due_date: string
  allow_late_submission?: boolean
}

export interface IAssignmentItem {
  id: string
  class_id: string
  class_name: string
  title: string
  subject: string
  total_score: number | null
  due_date: string
  allow_late_submission: boolean
  submission_count: number
  graded_count: number
  status: string
  created_at: string
}

export interface IAssignmentDetail {
  id: string
  class_id: string
  class_name: string
  teacher_id: string
  title: string
  description: string | null
  subject: string
  content: IAssignmentContent
  total_score: number | null
  due_date: string
  allow_late_submission: boolean
  submission_count: number
  graded_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface IStudentAnswer {
  question_number: number
  answer: string
}

export interface ISubmissionContent {
  answers: IStudentAnswer[]
}

export interface ISubmissionCreate {
  content: ISubmissionContent
  attachments?: Array<{ name: string; url: string }> | null
}

export interface ISubmissionItem {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  student_nickname: string
  score: number | null
  status: string
  submitted_at: string | null
  graded_at: string | null
}

export interface IStepFeedback {
  step: string
  correct: boolean
  comment: string
}

export interface IAIFeedback {
  score: number
  overall_comment: string
  step_feedback: IStepFeedback[]
  error_analysis: string | null
  suggested_score: number
}

export interface ISubmissionDetail {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  content: ISubmissionContent
  attachments: Array<{ name: string; url: string }> | null
  score: number | null
  ai_feedback: IAIFeedback | null
  teacher_feedback: string | null
  teacher_id: string | null
  status: string
  submitted_at: string | null
  graded_at: string | null
}

export interface IAssignmentStats {
  total_students: number
  submitted_count: number
  graded_count: number
  completion_rate: number
  average_score: number | null
  score_distribution: Record<string, number>
  question_stats: Array<{
    question_number: number
    stem: string
    type: string
    max_score: number
    average_score: number | null
    correct_rate: number | null
  }>
}

export interface IStudentAssignmentItem {
  id: string
  class_id: string
  class_name: string
  title: string
  subject: string
  total_score: number | null
  due_date: string
  allow_late_submission: boolean
  submission_count: number
  graded_count: number
  status: string
  my_status: 'pending' | 'submitted' | 'graded' | 'returned'
  my_submission_id: string | null
  my_score: number | null
  created_at: string
}

export interface IQuestionScore {
  question_number: number
  score: number
}

export interface IGradingRequest {
  scores?: IQuestionScore[] | null
  teacher_feedback?: string | null
  confirm_ai_feedback?: boolean
}

export interface IGradingResult {
  score: number
  max_score: number
  question_feedback: Array<{
    question_number: number
    score: number
    max_score?: number
    overall_comment?: string
  }>
  teacher_feedback: string | null
  status: string
}

export interface IBatchGradeResult {
  total: number
  success: number
  failed: number
  details: Array<{ submission_id: string; status: string; score?: number; error?: string }>
}

// ═══════════════════════════════════════════════════════════
// 教学资源库 (功能3)
// ═══════════════════════════════════════════════════════════

export type ResourceType = 'courseware' | 'exam_paper' | 'lesson_plan' | 'other'
export type ResourceVisibility = 'public' | 'private'
export type ResourceFileType = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'mp4' | 'image' | 'txt' | 'zip' | 'mp3'

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  courseware: '课件', exam_paper: '试卷', lesson_plan: '教案', other: '其他',
}

export const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF 文档', docx: 'Word 文档', pptx: 'PPT 课件', xlsx: 'Excel 表格',
  mp4: '视频', mp3: '音频', image: '图片', txt: '文本', zip: '压缩包',
}

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: 'Document', docx: 'Document', pptx: 'DataAnalysis', xlsx: 'DataAnalysis',
  mp4: 'VideoPlay', mp3: 'Headset', image: 'Picture', txt: 'Tickets', zip: 'FolderOpened',
}

export interface IResourceUploader { id: string; nickname: string; avatar_url: string | null }

export interface ITeachingResource {
  id: string; title: string; description: string | null
  subject: string; grade: string
  resource_type: ResourceType; resource_type_label: string
  file_type: ResourceFileType; file_type_label: string
  file_name: string; file_size: number; file_ext: string
  download_count: number; view_count: number; like_count: number
  visibility: ResourceVisibility; tags: string[] | null; is_favorited: boolean
  uploader: IResourceUploader | null; created_at: string; favorited_at?: string
}

export interface ITeachingResourceDetail extends ITeachingResource {
  keywords: string | null; status: string; updated_at: string
}

export interface IResourceListParams {
  page?: number; page_size?: number; keyword?: string
  subject?: string; grade?: string; resource_type?: ResourceType
  file_type?: string; sort_by?: string; sort_order?: string
}

export interface IResourceFilterOptions {
  subjects: string[]; grades: string[]
  resource_types: Array<{ value: string; label: string }>
  file_types: Array<{ value: string; label: string }>
}

export interface IFavoriteStatus { is_favorited: boolean; resource_id: string }

export const RESOURCE_ALLOWED_EXTENSIONS = [
  '.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx',
  '.mp4','.avi','.mov','.mp3','.wav','.flac',
  '.jpg','.jpeg','.png','.gif','.bmp','.webp','.svg',
  '.txt','.md','.zip','.rar','.7z',
]

export const RESOURCE_MAX_SIZE = 50 * 1024 * 1024

// ═══════════════════════════════════════════════════════════
// 班级资源分享 (功能6)
// ═══════════════════════════════════════════════════════════

export interface ISendToClassRequest {
  class_ids: string[]
}

export interface IClassResourceItem {
  id: string
  class_id: string
  class_name: string
  resource_id: string
  resource_title: string
  resource_file_type: string
  resource_file_name: string
  resource_file_size: number
  resource_subject: string
  resource_grade: string
  shared_by: string
  shared_by_name: string
  created_at: string | null
}

export interface ISendToClassResult {
  success_count: number
  skipped: string[]
  errors: string[]
}

export interface ISaveToKnowledgeResult {
  file_id: string
  filename: string
}

// ═══════════════════════════════════════════════════════════
// 智能教案生成 (PBI_LP)
// ═══════════════════════════════════════════════════════════

export interface ILessonPlanSection {
  title: string
  content: string
}

export interface IGenerateLessonPlanRequest {
  subject: string
  grade: string
  textbook_version: string
  unit_chapter: string
  class_hours: number
  teaching_objectives: string
  requirements?: string
  resource_id?: string | null
}

export interface ILessonPlanItem {
  id: string
  title: string
  subject: string
  grade: string
  textbook_version: string
  unit_chapter: string
  class_hours: number
  plan_content: string
  created_at: string
}

export interface ILessonPlanDetail {
  id: string
  title: string
  subject: string
  grade: string
  textbook_version: string
  unit_chapter: string
  class_hours: number
  teaching_objectives: string
  requirements?: string | null
  plan_content: string
  sections: ILessonPlanSection[]
  created_at: string
}

export interface ILessonPlanListQuery {
  page: number
  page_size: number
}

export interface ISSELessonPlanDoneEvent {
  type: 'done'
  lesson_plan_id: string
  title: string
}

/** 常用学科选项 */
export const SUBJECT_OPTIONS = [
  '语文', '数学', '英语', '物理', '化学', '生物',
  '历史', '地理', '政治', '道德与法治', '科学',
  '信息技术', '美术', '音乐', '体育',
]

/** 常用年级选项 */
export const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级',
  '高一', '高二', '高三',
]

// ═══════════════════════════════════════════════════════════
// 教师端 — 试卷生成器 (功能2)
// ═══════════════════════════════════════════════════════════

export type ExamType = 'unit_test' | 'midterm' | 'final'
export type ExamPaperStatus = 'generating' | 'completed' | 'failed'
export type ExportFormat = 'word' | 'pdf' | 'printable'

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  unit_test: '单元测试',
  midterm: '期中考试',
  final: '期末考试',
}

export interface IQuestionTypeConfig {
  type: string
  count: number
  score_per: number
  subtotal: number
}

export interface IExamPaperGenerateRequest {
  title: string
  subject: string
  grade: string
  exam_type: ExamType
  total_score: number
  difficulty_ratio: { easy: number; medium: number; hard: number }
  question_structure: IQuestionTypeConfig[]
  focus_instruction?: string
  resource_id?: string | null
}

export interface IExamPaperHeader {
  title: string
  subject: string
  grade: string
  exam_type: string
  total_score: number
  duration_minutes: number
  instructions: string
}

export interface IExamPaperQuestion {
  number: number
  stem: string
  question_type: string
  options?: string[]
  answer: string
  score: number
  analysis: string
  knowledge_points: string[]
}

export interface IExamPaperSection {
  title: string
  instructions: string
  questions: IExamPaperQuestion[]
}

export interface IExamPaperContent {
  header: IExamPaperHeader
  sections: IExamPaperSection[]
  answer_key: { number: number; answer: string; score: number }[]
  scoring_guide: string
}

export interface IExamPaperItem {
  id: string
  title: string
  subject: string
  grade: string
  exam_type: ExamType
  total_score: number
  status: ExamPaperStatus
  question_count: number
  created_at: string
}

export interface IExamPaperDetail {
  id: string
  user_id: string
  title: string
  subject: string
  grade: string
  exam_type: ExamType
  total_score: number
  difficulty_ratio: { easy: number; medium: number; hard: number }
  question_structure: IQuestionTypeConfig[]
  content: IExamPaperContent
  answer_sheet: Record<string, unknown> | null
  export_url: string | null
  export_format: string | null
  status: ExamPaperStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

// 试卷生成 SSE 事件
export interface ISSEExamThinkingEvent {
  type: 'thinking'
  stage: string
  message: string
}

export interface ISSEExamProgressEvent {
  type: 'progress'
  stage: string
  message: string
}

export interface ISSEExamDoneEvent {
  type: 'done'
  paper_id: string
  title: string
}

export type SSEExamEvent =
  | ISSEContentEvent
  | ISSEExamThinkingEvent
  | ISSEExamProgressEvent
  | ISSEExamDoneEvent
  | ISSEErrorEvent
