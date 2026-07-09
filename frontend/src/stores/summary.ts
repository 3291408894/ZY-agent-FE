/** 课文总结模块 — Pinia 状态管理 (PBI_06) */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ISummaryItem,
  ISummaryDetail,
  IKnowledgePoint,
  SummaryMode,
} from '@/types'
import {
  getSummaryList,
  getSummaryDetail,
  deleteSummary as deleteSummaryApi,
} from '@/api/modules/summary'

export const useSummaryStore = defineStore('summary', () => {
  // ── 当前总结状态 ──
  const currentContent = ref('')            // 正在流式生成的总结文本
  const currentKnowledgePoints = ref<IKnowledgePoint[]>([])
  const currentSummaryId = ref<string | null>(null)
  const isStreaming = ref(false)            // 是否正在流式生成
  const streamError = ref<string | null>(null)

  // ── 当前查看的总结详情 ──
  const currentDetail = ref<ISummaryDetail | null>(null)
  const detailLoading = ref(false)

  // ── 历史列表 ──
  const historyList = ref<ISummaryItem[]>([])
  const historyTotal = ref(0)
  const historyPage = ref(1)
  const historyPageSize = ref(20)
  const historyLoading = ref(false)
  const historyModeFilter = ref<SummaryMode | undefined>(undefined)

  const historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(historyTotal.value / historyPageSize.value))
  )

  // ── 操作 ──

  /** 重置当前总结状态（新建前调用） */
  function resetCurrent() {
    currentContent.value = ''
    currentKnowledgePoints.value = []
    currentSummaryId.value = null
    isStreaming.value = false
    streamError.value = null
  }

  /** 追加流式文本块 */
  function appendContent(chunk: string) {
    currentContent.value += chunk
  }

  /** 设置知识点 */
  function setKnowledgePoints(points: IKnowledgePoint[]) {
    currentKnowledgePoints.value = points
  }

  /** 标记总结完成 */
  function setDone(summaryId: string) {
    currentSummaryId.value = summaryId
    isStreaming.value = false
  }

  /** 设置流式错误 */
  function setStreamError(msg: string) {
    streamError.value = msg
    isStreaming.value = false
  }

  /** 获取总结详情 */
  async function fetchDetail(id: string) {
    detailLoading.value = true
    try {
      const res = await getSummaryDetail(id)
      currentDetail.value = res
    } finally {
      detailLoading.value = false
    }
  }

  /** 加载历史列表 */
  async function fetchHistory(page?: number, mode?: SummaryMode, keyword?: string) {
    historyLoading.value = true
    if (page !== undefined) historyPage.value = page
    if (mode !== undefined) historyModeFilter.value = mode

    try {
      const res = await getSummaryList({
        page: historyPage.value,
        page_size: historyPageSize.value,
        mode: historyModeFilter.value,
        keyword: keyword || undefined,
      })
      historyList.value = res.items
      historyTotal.value = res.total
    } finally {
      historyLoading.value = false
    }
  }

  /** 删除历史记录 */
  async function removeSummary(id: string) {
    await deleteSummaryApi(id)
    // 从本地列表中移除
    historyList.value = historyList.value.filter(item => item.id !== id)
    historyTotal.value--
  }

  return {
    // 状态
    currentContent,
    currentKnowledgePoints,
    currentSummaryId,
    isStreaming,
    streamError,
    currentDetail,
    detailLoading,
    historyList,
    historyTotal,
    historyPage,
    historyPageSize,
    historyLoading,
    historyModeFilter,
    historyTotalPages,
    // 方法
    resetCurrent,
    appendContent,
    setKnowledgePoints,
    setDone,
    setStreamError,
    fetchDetail,
    fetchHistory,
    removeSummary,
  }
})
