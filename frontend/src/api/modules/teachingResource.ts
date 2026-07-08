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

/** 下载 URL */
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
