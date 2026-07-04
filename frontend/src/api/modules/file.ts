// ================================================================
// 智翼 (ZhiYi) — 文件管理模块 API
// 对应 PBI_05 接口
// ================================================================

import { get, post, del } from '../request'
import type { IPaginationParams, IPaginatedData } from '../types'
import type { IUploadedFile, FileType, ParseStatus } from '@/types'
import axios from 'axios'

// ================================================================
// 错误码常量
// ================================================================
export const FileErrorCode = {
  SUCCESS: 0,
  VALIDATION_ERROR: 40001,
  FILE_FORMAT_UNSUPPORTED: 40002,
  FILE_SIZE_EXCEEDED: 40003,
  TOKEN_EXPIRED: 40101,
  TOKEN_INVALID: 40102,
  FORBIDDEN: 40301,
  RESOURCE_NOT_FOUND: 40402,
  FILE_PARSE_ERROR: 50003,
  INTERNAL_ERROR: 50001,
  NETWORK_ERROR: -1,
} as const

export type FileErrorCodeValue = (typeof FileErrorCode)[keyof typeof FileErrorCode]

/** 错误码 → 中文翻译 */
export function getErrorMsg(code: number): string {
  const map: Record<number, string> = {
    [FileErrorCode.SUCCESS]: '操作成功',
    [FileErrorCode.VALIDATION_ERROR]: '参数校验失败，请检查输入',
    [FileErrorCode.FILE_FORMAT_UNSUPPORTED]: '不支持的文件格式，支持 txt/md/pdf/docx/csv/json/html/xml/yaml',
    [FileErrorCode.FILE_SIZE_EXCEEDED]: '文件大小超过限制（最大 50MB）',
    [FileErrorCode.TOKEN_EXPIRED]: 'Token 已过期，请重新登录',
    [FileErrorCode.TOKEN_INVALID]: 'Token 无效，请重新登录',
    [FileErrorCode.FORBIDDEN]: '无权执行该操作',
    [FileErrorCode.RESOURCE_NOT_FOUND]: '文件不存在或已被删除',
    [FileErrorCode.FILE_PARSE_ERROR]: '文件解析失败，请检查文件内容',
    [FileErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
    [FileErrorCode.NETWORK_ERROR]: '网络异常，请稍后重试',
  }
  return map[code] ?? `未知错误 (code: ${code})`
}

/** 支持的文件格式 */
export const ALLOWED_FILE_TYPES: FileType[] = [
  'txt', 'md', 'pdf', 'docx', 'csv', 'json', 'html', 'xml', 'yaml',
]
export const ALLOWED_EXTENSIONS = ALLOWED_FILE_TYPES.map(t => `.${t}`).join(',')
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// ================================================================
// Mock 数据存储（内存中）
// ================================================================

/** 是否是 Mock 模式 */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

/** 生成 Mock 文件列表 */
function generateMockFiles(count: number = 25): IUploadedFile[] {
  const types: FileType[] = ['txt', 'md', 'pdf', 'docx', 'csv', 'json', 'html', 'xml', 'yaml']
  const names = [
    '数学公式手册', '物理实验报告', '化学方程式汇总', '英语语法笔记',
    '历史大事年表', '地理知识点总结', '生物细胞结构图', '语文古诗词鉴赏',
    '政治答题模板', '期中考试复习大纲', '学习方法论', '错题归纳整理',
    '三角函数公式推导', '力学分析习题', '有机化学笔记', '阅读理解技巧',
    '中国近代史纲要', '世界地理概况', '遗传学基础', '作文素材积累',
    '二次函数专题', '电路分析总结', '元素周期表详解', '文言文虚词用法',
    '经济学基础概念',
  ]

  return Array.from({ length: count }, (_, i) => {
    const fileType = types[i % types.length]
    const statuses: ParseStatus[] = ['pending', 'processing', 'done', 'failed']
    const status = statuses[i % 4]
    const name = names[i] || `文件_${i + 1}`
    const created = new Date(Date.now() - i * 3600000 * 24).toISOString()

    const file: IUploadedFile = {
      id: `file-${String(i + 1).padStart(4, '0')}`,
      user_id: 'user-001',
      filename: `${name}.${fileType}`,
      file_type: fileType,
      file_size: Math.round(Math.random() * 40 * 1024 * 1024) + 1024,
      storage_path: `/uploads/${fileType}/${name}.${fileType}`,
      parse_status: status,
      created_at: created,
    }

    if (status === 'done') {
      file.parsed_content = `# ${name}\n\n这是《${name}》的解析内容。\n\n## 核心概念\n- 知识点一：基础定义与原理\n- 知识点二：关键公式与推导\n- 知识点三：常见应用场景\n\n## 详细说明\n\n本部分内容涵盖了${name}的核心知识体系，适合 K12 学生系统学习使用。\n\n> 学习建议：结合课后习题加深理解。`
      file.summary = `${name}主要涵盖了相关学科的核心概念与基本原理，通过系统性学习可掌握关键知识点及其应用方法。`
      file.knowledge_points = ['基础概念', '公式推导', '应用方法', '常见题型', '易错点分析']
    }

    if (status === 'failed') {
      file.parsed_content = undefined
      file.summary = undefined
      file.knowledge_points = undefined
    }

    return file
  })
}

/** 内存 Mock 数据存储 */
const mockStore = (() => {
  const files = generateMockFiles(25)

  function getPage(page: number, pageSize: number, fileType?: string): IPaginatedData<IUploadedFile> {
    let filtered = files
    if (fileType) {
      filtered = files.filter(f => f.file_type === fileType)
    }
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return {
      items,
      total: filtered.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize),
    }
  }

  function getById(id: string): IUploadedFile | undefined {
    return files.find(f => f.id === id)
  }

  function remove(id: string): boolean {
    const idx = files.findIndex(f => f.id === id)
    if (idx === -1) return false
    files.splice(idx, 1)
    return true
  }

  function add(file: IUploadedFile) {
    files.unshift(file)
  }

  return { files, getPage, getById, remove, add }
})()

/** 模拟网络延迟 */
function mockDelay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ================================================================
// API 请求函数（自动切换 Mock / 真实）
// ================================================================

/** 获取文件列表（分页 + 筛选） */
export async function getFileList(
  page = 1,
  pageSize = 20,
  fileType?: FileType | ''
): Promise<IPaginatedData<IUploadedFile>> {
  if (isMockMode()) {
    await mockDelay()
    return mockStore.getPage(page, pageSize, fileType || undefined)
  }
  const params: Record<string, any> = { page, page_size: pageSize }
  if (fileType) params.file_type = fileType
  return get<IPaginatedData<IUploadedFile>>('/api/v1/files', params)
}

/** 查询文件解析状态 */
export async function getFileStatus(fileId: string): Promise<IUploadedFile> {
  if (isMockMode()) {
    await mockDelay(200)
    const file = mockStore.getById(fileId)
    if (!file) throw Object.assign(new Error('文件不存在'), { code: FileErrorCode.RESOURCE_NOT_FOUND })
    return file
  }
  return get<IUploadedFile>(`/api/v1/files/${fileId}/status`)
}

/** 删除文件 */
export async function deleteFile(fileId: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay()
    const ok = mockStore.remove(fileId)
    if (!ok) throw Object.assign(new Error('文件不存在'), { code: FileErrorCode.RESOURCE_NOT_FOUND })
    return
  }
  return del(`/api/v1/files/${fileId}`)
}

/** 重新解析文件 */
export async function reparseFile(fileId: string): Promise<IUploadedFile> {
  if (isMockMode()) {
    await mockDelay()
    const file = mockStore.getById(fileId)
    if (!file) throw Object.assign(new Error('文件不存在'), { code: FileErrorCode.RESOURCE_NOT_FOUND })

    // 模拟：设置为 processing
    file.parse_status = 'processing'
    // 模拟 2 秒后自动变成 done
    setTimeout(() => {
      file.parse_status = 'done'
      file.parsed_content = `# ${file.filename}\n\n（重新）解析完成的内容...\n\n## 更新内容\n- 已重新提取知识点\n- 已更新摘要`
      file.summary = `（重新解析）${file.filename} 的 AI 摘要 — 更新时间：${new Date().toLocaleString('zh-CN')}`
      file.knowledge_points = ['重新解析', '知识点A', '知识点B', '知识点C', '更新内容']
    }, 2000)
    return file
  }
  return post<IUploadedFile>(`/api/v1/files/${fileId}/reparse`)
}

/** 上传文件（multipart/form-data + 进度回调） */
export async function uploadFile(
  file: File,
  autoParse: boolean = true,
  onProgress?: (percent: number) => void
): Promise<IUploadedFile> {
  // ── Mock 模式：模拟上传 ──
  if (isMockMode()) {
    // 模拟上传进度
    let progress = 0
    const progressTimer = setInterval(() => {
      progress += Math.random() * 30 + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(progressTimer)
      }
      onProgress?.(Math.min(Math.round(progress), 100))
    }, 300)

    await mockDelay(1500)
    clearInterval(progressTimer)
    onProgress?.(100)

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
    const newFile: IUploadedFile = {
      id: `file-${Date.now()}`,
      user_id: 'user-001',
      filename: file.name,
      file_type: ext as FileType,
      file_size: file.size,
      storage_path: `/uploads/${ext}/${file.name}`,
      parse_status: autoParse ? 'processing' : 'pending',
      created_at: new Date().toISOString(),
    }

    mockStore.add(newFile)

    // 如果自动解析开启，2 秒后模拟完成
    if (autoParse) {
      setTimeout(() => {
        newFile.parse_status = 'done'
        newFile.parsed_content = `# ${file.name}\n\n自动解析完成的内容...\n\n## 知识点\n- AI 自动提取的核心概念\n- 结构化笔记`
        newFile.summary = `文件「${file.name}」已自动解析完成，共提取 N 个知识点。`
        newFile.knowledge_points = ['自动解析', 'AI提取', '核心概念', '知识点归纳']
      }, 2000)
    }

    return newFile
  }

  // ── 真实模式：axios 上传 ──
  const formData = new FormData()
  formData.append('file', file)
  formData.append('auto_parse', String(autoParse))

  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const token = localStorage.getItem('access_token')

  return axios
    .post<IUploadedFile>(`${baseURL}/api/v1/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
    .then((res) => {
      const body = res.data as any
      if (body.code !== undefined && body.code !== 0) {
        const err = new Error(body.message || '上传失败')
        ;(err as any).code = body.code ?? FileErrorCode.INTERNAL_ERROR
        throw err
      }
      return (body.data ?? body) as IUploadedFile
    })
}
