// ================================================================
// 智翼 (ZhiYi) — 教学资源库 API 模块 (功能3)
// ================================================================

import request, { get, post, del } from '../request'
import type { ITeachingResource, ITeachingResourceDetail, IResourceListParams, IResourceFilterOptions, IFavoriteStatus } from '@/types'

/** 上传资源 */
export async function uploadResource(formData: FormData, onProgress?: (p: number) => void): Promise<ITeachingResource> {
  return request.post('/api/v1/teacher/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => { if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total)) },
  }).then(d => d as unknown as ITeachingResource)
}

/** 资源广场列表 */
export async function getResourceList(params: IResourceListParams) {
  return get<any>('/api/v1/teacher/resources', params)
}

/** 我的上传 */
export async function getMyResources(params: { page?: number; page_size?: number; resource_type?: string; visibility?: string }) {
  return get<any>('/api/v1/teacher/resources/my', params)
}

/** 我的收藏 */
export async function getMyFavorites(params: { page?: number; page_size?: number }) {
  return get<any>('/api/v1/teacher/resources/favorites', params)
}

/** 筛选选项 */
export async function getFilterOptions(): Promise<IResourceFilterOptions> {
  return get<IResourceFilterOptions>('/api/v1/teacher/resources/filter-options')
}

/** 资源详情 */
export async function getResourceDetail(id: string): Promise<ITeachingResourceDetail> {
  return get<ITeachingResourceDetail>(`/api/v1/teacher/resources/${id}`)
}

/** 下载资源（带认证的 Blob 下载，避免 URL 传 token 导致的 401） */
export async function downloadResource(id: string, filename?: string): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${base}/api/v1/teacher/resources/${id}/download`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `下载失败 (${res.status})` }))
    throw new Error(err?.detail?.message || err?.message || `下载失败 (${res.status})`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // 尝试从 Content-Disposition 解析文件名，否则使用传入的文件名
  const disposition = res.headers.get('Content-Disposition')
  const match = disposition?.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/)
  a.download = match ? decodeURIComponent(match[1]) : (filename || 'download')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 获取下载链接（仅供组件内使用，推荐用 downloadResource 进行鉴权下载） */
export function getDownloadUrl(id: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  const token = localStorage.getItem('access_token')
  return `${base}/api/v1/teacher/resources/${id}/download?token=${token || ''}`
}

/** 删除 */
export async function deleteResource(id: string): Promise<void> {
  return del(`/api/v1/teacher/resources/${id}`)
}

/** 切换收藏 */
export async function toggleFavorite(id: string): Promise<IFavoriteStatus> {
  return post<IFavoriteStatus>(`/api/v1/teacher/resources/${id}/favorite`)
}

/** 获取资源简洁列表（供下拉框使用，不分页取前100条） */
export async function getResourceSelectList(params?: { resource_type?: string; subject?: string; grade?: string }) {
  return get<any>('/api/v1/teacher/resources', { page: 1, page_size: 100, ...params })
}

/** 发送资源到班级 */
export async function sendResourceToClass(resourceId: string, data: { class_ids: string[] }): Promise<any> {
  return post<any>(`/api/v1/teacher/resources/${resourceId}/send-to-class`, data)
}
