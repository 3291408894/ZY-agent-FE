// ================================================================
// 智翼 (ZhiYi) — 教学资源库状态管理 (功能3)
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ITeachingResource, ITeachingResourceDetail, IResourceListParams, IResourceFilterOptions } from '@/types'
import { getResourceList, getMyResources, getMyFavorites, getResourceDetail, deleteResource, toggleFavorite, uploadResource, getFilterOptions } from '@/api/modules/teachingResource'
import { ElMessage } from 'element-plus'

export const useTeachingResourceStore = defineStore('teachingResource', () => {
  const resources = ref<ITeachingResource[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)
  const activeTab = ref<'square' | 'my' | 'favorites'>('square')

  const filters = ref<IResourceListParams>({ page: 1, page_size: 20, keyword: '', sort_by: 'created_at', sort_order: 'desc' })
  const filterOptions = ref<IResourceFilterOptions>({ subjects: [], grades: [], resource_types: [], file_types: [] })

  const uploading = ref(false)
  const uploadProgress = ref(0)

  const currentDetail = ref<ITeachingResourceDetail | null>(null)
  const detailLoading = ref(false)

  const hasResources = computed(() => resources.value.length > 0)

  // ── 资源广场 ──
  async function fetchResources(page?: number) {
    if (page !== undefined) currentPage.value = page
    loading.value = true; activeTab.value = 'square'
    try {
      const params: any = { ...filters.value, page: currentPage.value, page_size: pageSize.value }
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === undefined) delete params[k] })
      const data = await getResourceList(params)
      resources.value = data.items; total.value = data.total; totalPages.value = data.total_pages; currentPage.value = data.page
    } catch { } finally { loading.value = false }
  }

  // ── 我的资源 ──
  async function fetchMyResources(page?: number) {
    if (page !== undefined) currentPage.value = page
    loading.value = true; activeTab.value = 'my'
    try {
      const data = await getMyResources({ page: currentPage.value, page_size: pageSize.value })
      resources.value = data.items; total.value = data.total; totalPages.value = data.total_pages; currentPage.value = data.page
    } catch { } finally { loading.value = false }
  }

  // ── 我的收藏 ──
  async function fetchMyFavorites(page?: number) {
    if (page !== undefined) currentPage.value = page
    loading.value = true; activeTab.value = 'favorites'
    try {
      const data = await getMyFavorites({ page: currentPage.value, page_size: pageSize.value })
      resources.value = data.items; total.value = data.total; totalPages.value = data.total_pages; currentPage.value = data.page
    } catch { } finally { loading.value = false }
  }

  async function switchTab(tab: 'square' | 'my' | 'favorites') {
    activeTab.value = tab; currentPage.value = 1
    if (tab === 'square') await fetchResources(1)
    else if (tab === 'my') await fetchMyResources(1)
    else await fetchMyFavorites(1)
  }

  function setFilter(key: keyof IResourceListParams, value: any) {
    (filters.value as any)[key] = value || undefined; currentPage.value = 1; fetchResources(1)
  }

  function clearFilters() {
    filters.value = { page: 1, page_size: pageSize.value, keyword: '', sort_by: 'created_at', sort_order: 'desc' }
    currentPage.value = 1; fetchResources(1)
  }

  async function fetchFilterOptions() {
    try { filterOptions.value = await getFilterOptions() } catch { }
  }

  async function upload(formData: FormData): Promise<ITeachingResource | null> {
    uploading.value = true; uploadProgress.value = 0
    try {
      const result = await uploadResource(formData, p => { uploadProgress.value = p })
      ElMessage.success('资源上传成功！')
      activeTab.value === 'my' ? await fetchMyResources(1) : await fetchResources(1)
      return result
    } catch { return null } finally { uploading.value = false; uploadProgress.value = 0 }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await deleteResource(id); ElMessage.success('资源已删除')
      if (resources.value.length === 1 && currentPage.value > 1) currentPage.value--
      if (activeTab.value === 'square') await fetchResources()
      else if (activeTab.value === 'my') await fetchMyResources()
      else await fetchMyFavorites()
      return true
    } catch { return false }
  }

  async function toggleFav(id: string): Promise<boolean | null> {
    try {
      const result = await toggleFavorite(id)
      const idx = resources.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        resources.value[idx].is_favorited = result.is_favorited
        resources.value[idx].like_count += result.is_favorited ? 1 : -1
      }
      if (currentDetail.value?.id === id) {
        currentDetail.value.is_favorited = result.is_favorited
        currentDetail.value.like_count += result.is_favorited ? 1 : -1
      }
      ElMessage.success(result.is_favorited ? '已收藏' : '已取消收藏')
      return result.is_favorited
    } catch { return null }
  }

  async function fetchDetail(id: string): Promise<ITeachingResourceDetail | null> {
    detailLoading.value = true
    try { currentDetail.value = await getResourceDetail(id); return currentDetail.value } catch { return null } finally { detailLoading.value = false }
  }

  async function goToPage(page: number) {
    currentPage.value = page
    if (activeTab.value === 'square') await fetchResources()
    else if (activeTab.value === 'my') await fetchMyResources()
    else await fetchMyFavorites()
  }

  return { resources, total, totalPages, currentPage, pageSize, loading, activeTab, filters, filterOptions, uploading, uploadProgress, currentDetail, detailLoading, hasResources, fetchResources, fetchMyResources, fetchMyFavorites, switchTab, setFilter, clearFilters, fetchFilterOptions, upload, remove, toggleFav, fetchDetail, goToPage }
})
