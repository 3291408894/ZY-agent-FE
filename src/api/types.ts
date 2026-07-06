// ================================================================
// 智翼 (ZhiYi) — API 通用请求/响应类型
// ================================================================

/** 统一响应格式（与后端 app/schemas/common.py 对应） */
export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
  detail?: string | null
}

/** 分页响应 */
export interface IPaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** 分页查询参数 */
export interface IPaginationParams {
  page?: number
  page_size?: number
}

/** API 错误码映射（与文档附录 A.3 对应） */
export enum ErrorCode {
  SUCCESS = 0,
  VALIDATION_ERROR = 40001,
  FILE_FORMAT_UNSUPPORTED = 40002,
  FILE_SIZE_EXCEEDED = 40003,
  TOKEN_EXPIRED = 40101,
  TOKEN_INVALID = 40102,
  FORBIDDEN = 40301,
  USER_NOT_FOUND = 40401,
  RESOURCE_NOT_FOUND = 40402,
  EMAIL_OR_PHONE_EXISTS = 40901,
  RATE_LIMIT = 42901,
  INTERNAL_ERROR = 50001,
  LLM_SERVICE_ERROR = 50002,
  FILE_PARSE_ERROR = 50003,
}
