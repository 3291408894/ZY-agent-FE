/** 智能教案生成模块 — Pinia 状态管理 (PBI_LP) */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ILessonPlanItem,
  ILessonPlanDetail,
} from '@/types'
import {
  getLessonPlanList,
  getLessonPlanDetail,
  deleteLessonPlan as deleteLessonPlanApi,
} from '@/api/modules/lessonPlan'

export const useLessonPlanStore = defineStore('lessonPlan', () => {
  // ── 当前教案生成状态 ──
  const currentContent = ref('')
  const currentLessonPlanId = ref<string | null>(null)
  const currentTitle = ref('')
  const isStreaming = ref(false)
  const streamError = ref<string | null>(null)

  // ── 当前查看的教案详情 ──
  const currentDetail = ref<ILessonPlanDetail | null>(null)
  const detailLoading = ref(false)

  // ── 历史列表 ──
  const historyList = ref<ILessonPlanItem[]>([])
  const historyTotal = ref(0)
  const historyPage = ref(1)
  const historyPageSize = ref(20)
  const historyLoading = ref(false)

  const historyTotalPages = computed(() =>
    Math.max(1, Math.ceil(historyTotal.value / historyPageSize.value))
  )

  // ── 操作 ──

  /** 重置当前教案状态（新建前调用） */
  function resetCurrent() {
    currentContent.value = ''
    currentLessonPlanId.value = null
    currentTitle.value = ''
    isStreaming.value = false
    streamError.value = null
  }

  /** 追加流式文本块 */
  function appendContent(chunk: string) {
    currentContent.value += chunk
  }

  /** 标记教案生成完成 */
  function setDone(lessonPlanId: string, title: string) {
    currentLessonPlanId.value = lessonPlanId
    currentTitle.value = title
    isStreaming.value = false
  }

  /** 设置流式错误 */
  function setStreamError(msg: string) {
    streamError.value = msg
    isStreaming.value = false
  }

  /** 获取教案详情 */
  async function fetchDetail(id: string) {
    detailLoading.value = true
    try {
      const res = await getLessonPlanDetail(id)
      currentDetail.value = res
    } finally {
      detailLoading.value = false
    }
  }

  /** 加载历史列表 */
  async function fetchHistory(page?: number) {
    historyLoading.value = true
    if (page !== undefined) historyPage.value = page

    try {
      const res = await getLessonPlanList({
        page: historyPage.value,
        page_size: historyPageSize.value,
      })
      historyList.value = res.items
      historyTotal.value = res.total
    } finally {
      historyLoading.value = false
    }
  }

  /** 删除历史记录 */
  async function removeLessonPlan(id: string) {
    await deleteLessonPlanApi(id)
    historyList.value = historyList.value.filter(item => item.id !== id)
    historyTotal.value--
  }

  return {
    // 状态
    currentContent,
    currentLessonPlanId,
    currentTitle,
    isStreaming,
    streamError,
    currentDetail,
    detailLoading,
    historyList,
    historyTotal,
    historyPage,
    historyPageSize,
    historyLoading,
    historyTotalPages,
    // 方法
    resetCurrent,
    appendContent,
    setDone,
    setStreamError,
    fetchDetail,
    fetchHistory,
    removeLessonPlan,
  }
})
