/** 试卷生成器 Pinia Store */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  IExamPaperItem,
  IExamPaperDetail,
  IExamPaperGenerateRequest,
  IQuestionTypeConfig,
  ExamType,
  ExamPaperStatus,
  IPaginatedData,
} from '@/types'
import { listExamPapers, getExamPaperDetail, deleteExamPaper } from '@/api/modules/examPaper'

export const useExamPaperStore = defineStore('examPaper', () => {
  // ── State ──
  const papers = ref<IExamPaperItem[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)

  const currentPaper = ref<IExamPaperDetail | null>(null)
  const detailLoading = ref(false)

  // 生成状态机: 'config' | 'generating' | 'preview'
  const stage = ref<'config' | 'generating' | 'preview'>('config')
  const generatedContent = ref('')
  const generatedPaperId = ref<string | null>(null)
  const sseError = ref<string | null>(null)
  const thinkingStage = ref('')

  // 配置缓存
  const lastConfig = ref<IExamPaperGenerateRequest | null>(null)

  // ── Getters ──
  const hasPapers = computed(() => papers.value.length > 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  // ── Actions ──

  /** 加载历史列表 */
  async function fetchPapers(params?: {
    page?: number
    page_size?: number
    subject?: string
    exam_type?: string
  }) {
    loading.value = true
    try {
      const page = params?.page ?? currentPage.value
      const size = params?.page_size ?? pageSize.value
      const data: IPaginatedData<IExamPaperItem> = await listExamPapers({
        page,
        page_size: size,
        subject: params?.subject,
        exam_type: params?.exam_type,
      })
      papers.value = data.items
      total.value = data.total
      currentPage.value = data.page
      pageSize.value = data.page_size
    } finally {
      loading.value = false
    }
  }

  /** 加载试卷详情 */
  async function fetchDetail(id: string) {
    detailLoading.value = true
    try {
      currentPaper.value = await getExamPaperDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  /** 删除试卷 */
  async function removePaper(id: string) {
    await deleteExamPaper(id)
    papers.value = papers.value.filter((p) => p.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  /** 进入生成阶段 */
  function startGeneration(config: IExamPaperGenerateRequest) {
    lastConfig.value = config
    stage.value = 'generating'
    generatedContent.value = ''
    generatedPaperId.value = null
    sseError.value = null
    thinkingStage.value = ''
  }

  /** SSE 内容追加 */
  function appendContent(chunk: string) {
    generatedContent.value += chunk
  }

  /** 生成完成 */
  function generationDone(paperId: string) {
    generatedPaperId.value = paperId
    stage.value = 'preview'
  }

  /** 生成失败 */
  function generationFailed(error: string) {
    sseError.value = error
    stage.value = 'config'
  }

  /** 重置状态 */
  function resetStage() {
    stage.value = 'config'
    generatedContent.value = ''
    generatedPaperId.value = null
    sseError.value = null
    thinkingStage.value = ''
  }

  /** 更新思考阶段 */
  function setThinking(stage: string) {
    thinkingStage.value = stage
  }

  return {
    // state
    papers,
    total,
    currentPage,
    pageSize,
    loading,
    currentPaper,
    detailLoading,
    stage,
    generatedContent,
    generatedPaperId,
    sseError,
    thinkingStage,
    lastConfig,
    // getters
    hasPapers,
    totalPages,
    // actions
    fetchPapers,
    fetchDetail,
    removePaper,
    startGeneration,
    appendContent,
    generationDone,
    generationFailed,
    resetStage,
    setThinking,
  }
})
