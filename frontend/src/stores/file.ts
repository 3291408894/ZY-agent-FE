// ================================================================
// 智翼 (ZhiYi) — 文件管理状态管理 (Pinia Store)
// 对应 PBI_05：多格式文件上传解析
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUploadedFile, FileType } from '@/types'
import {
  getFileList,
  getFileStatus,
  deleteFile,
  reparseFile,
  uploadFile,
  getErrorMsg,
} from '@/api/modules/file'
import { ElMessage } from 'element-plus'

export const useFileStore = defineStore('file', () => {
  // ================================================================
  // State
  // ================================================================
  const files = ref<IUploadedFile[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)

  // 筛选条件
  const filterFileType = ref<FileType | ''>('')

  // 上传相关
  const uploading = ref(false)
  const uploadProgress = ref(0)

  // 详情轮询
  const pollingTimers = new Map<string, ReturnType<typeof setInterval>>()

  // ================================================================
  // Getters
  // ================================================================
  const hasFiles = computed(() => files.value.length > 0)
  const fileTypeOptions = computed(() => [
    { label: '全部类型', value: '' },
    { label: 'TXT', value: 'txt' },
    { label: 'Markdown', value: 'md' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Word', value: 'docx' },
    { label: 'CSV', value: 'csv' },
    { label: 'JSON', value: 'json' },
    { label: 'HTML', value: 'html' },
    { label: 'XML', value: 'xml' },
    { label: 'YAML', value: 'yaml' },
  ])

  // ================================================================
  // Actions — 文件列表
  // ================================================================

  /** 获取文件列表 */
  async function fetchFiles(page?: number) {
    if (page !== undefined) currentPage.value = page

    loading.value = true
    try {
      const data = await getFileList(
        currentPage.value,
        pageSize.value,
        filterFileType.value || undefined
      )
      files.value = data.items
      total.value = data.total
      totalPages.value = data.total_pages
      currentPage.value = data.page
    } catch (err: any) {
      const code = err?.code ?? -1
      ElMessage.error(getErrorMsg(code))
    } finally {
      loading.value = false
    }
  }

  /** 按类型筛选 */
  async function filterByType(fileType: FileType | '') {
    filterFileType.value = fileType
    currentPage.value = 1
    await fetchFiles()
  }

  /** 翻页 */
  async function goToPage(page: number) {
    await fetchFiles(page)
  }

  // ================================================================
  // Actions — 文件操作
  // ================================================================

  /** 上传文件 */
  async function upload(
    file: File,
    autoParse: boolean = true
  ): Promise<IUploadedFile | null> {
    uploading.value = true
    uploadProgress.value = 0

    try {
      const result = await uploadFile(file, autoParse, (percent) => {
        uploadProgress.value = percent
      })
      ElMessage.success('上传成功！')
      // 刷新列表
      await fetchFiles()
      return result
    } catch (err: any) {
      const code = err?.code ?? -1
      ElMessage.error(getErrorMsg(code))
      return null
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  /** 删除文件 */
  async function remove(fileId: string): Promise<boolean> {
    try {
      await deleteFile(fileId)
      ElMessage.success('文件已删除')
      // 如果当前页删空了，回退一页
      if (files.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      await fetchFiles()
      return true
    } catch (err: any) {
      const code = err?.code ?? -1
      ElMessage.error(getErrorMsg(code))
      return false
    }
  }

  /** 重新解析文件 */
  async function reparse(fileId: string): Promise<IUploadedFile | null> {
    try {
      const updated = await reparseFile(fileId)
      ElMessage.success('已提交重新解析，请稍候...')
      // 刷新列表中的该文件状态
      await fetchFiles()
      return updated
    } catch (err: any) {
      const code = err?.code ?? -1
      ElMessage.error(getErrorMsg(code))
      return null
    }
  }

  /** 刷新单个文件状态 */
  async function refreshFileStatus(fileId: string): Promise<IUploadedFile | null> {
    try {
      const file = await getFileStatus(fileId)
      // 更新列表中的该文件
      const idx = files.value.findIndex(f => f.id === fileId)
      if (idx !== -1) {
        files.value[idx] = file
      }
      return file
    } catch (err: any) {
      const code = err?.code ?? -1
      ElMessage.error(getErrorMsg(code))
      return null
    }
  }

  // ================================================================
  // Actions — 轮询（用于详情页解析中状态刷新）
  // ================================================================

  /** 开始轮询文件状态 */
  function startPolling(fileId: string, callback: (file: IUploadedFile) => void, intervalMs = 3000) {
    // 清除已有轮询
    stopPolling(fileId)

    const timer = setInterval(async () => {
      const file = await refreshFileStatus(fileId)
      if (file) {
        callback(file)
        // 如果不再是 processing，自动停止轮询
        if (file.parse_status !== 'processing') {
          stopPolling(fileId)
        }
      }
    }, intervalMs)

    pollingTimers.set(fileId, timer)
  }

  /** 停止轮询 */
  function stopPolling(fileId: string) {
    const timer = pollingTimers.get(fileId)
    if (timer) {
      clearInterval(timer)
      pollingTimers.delete(fileId)
    }
  }

  /** 清除所有轮询 */
  function clearAllPolling() {
    pollingTimers.forEach((timer) => clearInterval(timer))
    pollingTimers.clear()
  }

  return {
    // state
    files,
    total,
    totalPages,
    currentPage,
    pageSize,
    loading,
    filterFileType,
    uploading,
    uploadProgress,
    // getters
    hasFiles,
    fileTypeOptions,
    // actions
    fetchFiles,
    filterByType,
    goToPage,
    upload,
    remove,
    reparse,
    refreshFileStatus,
    startPolling,
    stopPolling,
    clearAllPolling,
  }
})
