// ================================================================
// 智翼 (ZhiYi) — 文件管理模块 API
// 对应 PBI_05 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams } from '../types'
import type { IUploadedFile } from '@/types'

/** 获取文件列表 */
export function getFileList(params?: IPaginationParams) {
  return get<IUploadedFile[]>('/api/v1/files', params)
}

/** 查询文件解析状态 */
export function getFileStatus(fileId: string) {
  return get<IUploadedFile>(`/api/v1/files/${fileId}/status`)
}

/** 删除文件 */
export function deleteFile(fileId: string) {
  return del(`/api/v1/files/${fileId}`)
}

/** 重新解析文件 */
export function reparseFile(fileId: string) {
  return post(`/api/v1/files/${fileId}/reparse`)
}

// 注意：POST /files/upload 使用 multipart/form-data
// 请使用 FormData + Axios 或 fetch 发起请求
