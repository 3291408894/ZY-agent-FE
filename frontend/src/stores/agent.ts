// ================================================================
// 智翼 (ZhiYi) — AI Agent 状态管理 (Pinia Store)
// 对应 PBI_04：AI Agent 自然语言交互
// 对应 PBI_12：AI 思考过程可视化
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ISessionGroup,
  ISessionDetail,
  IChatSession,
  IChatMessage,
  IThoughtStep,
} from '@/types'
import {
  getSessions,
  getSessionMessages,
  updateSessionTitle,
  deleteSession,
} from '@/api/modules/agent'
import {
  mockSessions,
  mockMessages,
  delay,
  isMockEnabled,
} from '@/api/mock/agentMock'

export const useAgentStore = defineStore('agent', () => {
  // ================================================================
  // State — 会话列表
  // ================================================================
  const sessions = ref<ISessionGroup[]>([])
  const isLoadingSessions = ref(false)
  const sessionsError = ref<string | null>(null)

  // ================================================================
  // State — 当前会话
  // ================================================================
  const currentSessionId = ref<string | null>(null)
  const currentSessionTitle = ref<string>('新对话')
  const messages = ref<IChatMessage[]>([])
  const isLoadingMessages = ref(false)
  const messagesError = ref<string | null>(null)

  // ================================================================
  // State — 流式响应 & 思考链
  // ================================================================
  const isStreaming = ref(false)
  const thoughtChain = ref<IThoughtStep[]>([])

  // ================================================================
  // Getters
  // ================================================================
  const hasMessages = computed(() => messages.value.length > 0)
  const hasSessions = computed(() =>
    sessions.value.some((g) => g.sessions.length > 0)
  )
  const lastAssistantMessage = computed(() => {
    const msgs = messages.value
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') return msgs[i]
    }
    return null
  })

  // ================================================================
  // Actions — 会话列表
  // ================================================================

  /** 获取会话列表（按日期分组），API 失败时自动 fallback 到 Mock */
  async function fetchSessions() {
    isLoadingSessions.value = true
    sessionsError.value = null
    try {
      const data = await getSessions()
      sessions.value = data.groups ?? []
    } catch (e: any) {
      // Token 过期由拦截器处理，其他错误 fallback 到 Mock
      if (e?.message?.includes('登录已过期')) {
        sessionsError.value = e.message
        return
      }
      // 网络错误 → 使用 Mock 数据
      if (isMockEnabled() || e?.message?.includes('Network Error') || e?.code === 'ERR_NETWORK') {
        console.warn('会话列表 API 不可用，使用 Mock 数据')
        await delay(400)
        sessions.value = mockSessions
        if (!isMockEnabled()) {
          localStorage.setItem('zhiyi-use-mock', '1')
        }
        return
      }
      sessionsError.value = e?.message || '加载会话列表失败'
    } finally {
      isLoadingSessions.value = false
    }
  }

  /** 乐观删除：从本地列表中移除会话 */
  function removeSessionLocally(sessionId: string) {
    for (const group of sessions.value) {
      const idx = group.sessions.findIndex((s) => s.id === sessionId)
      if (idx !== -1) {
        group.sessions.splice(idx, 1)
        break
      }
    }
    // 清理空分组
    sessions.value = sessions.value.filter((g) => g.sessions.length > 0)
  }

  /** 乐观更新：修改本地会话标题 */
  function updateTitleLocally(sessionId: string, title: string) {
    for (const group of sessions.value) {
      const session = group.sessions.find((s) => s.id === sessionId)
      if (session) {
        session.title = title
        break
      }
    }
  }

  // ================================================================
  // Actions — 会话详情 & 消息
  // ================================================================

  /** 加载某个会话的历史消息，API 失败时自动 fallback 到 Mock */
  async function loadSession(sessionId: string) {
    if (currentSessionId.value === sessionId && messages.value.length > 0) {
      return
    }

    isLoadingMessages.value = true
    messagesError.value = null
    try {
      const detail: ISessionDetail = await getSessionMessages(sessionId)
      currentSessionId.value = detail.id
      currentSessionTitle.value = detail.title
      messages.value = detail.messages ?? []
      thoughtChain.value = []
    } catch (e: any) {
      if (e?.message?.includes('登录已过期')) {
        messagesError.value = e.message
        return
      }
      // 网络错误 → 使用 Mock 数据
      if (mockMessages[sessionId]) {
        console.warn('消息 API 不可用，使用 Mock 数据')
        await delay(300)
        currentSessionId.value = sessionId
        // 从 mockSessions 中找标题
        for (const group of mockSessions) {
          const s = group.sessions.find((x) => x.id === sessionId)
          if (s) { currentSessionTitle.value = s.title; break }
        }
        messages.value = mockMessages[sessionId]
        thoughtChain.value = []
        return
      }
      messagesError.value = e?.message || '加载消息失败'
    } finally {
      isLoadingMessages.value = false
    }
  }

  // ================================================================
  // Actions — 新建对话
  // ================================================================

  /** 开始新对话，清空当前会话状态 */
  function newChat() {
    currentSessionId.value = null
    currentSessionTitle.value = '新对话'
    messages.value = []
    messagesError.value = null
    thoughtChain.value = []
  }

  // ================================================================
  // Actions — 流式消息
  // ================================================================

  /** 添加一条用户消息到列表 */
  function addUserMessage(content: string) {
    messages.value.push({
      id: Date.now(),
      session_id: currentSessionId.value ?? '',
      role: 'user',
      content,
      thought_chain: null,
      tool_calls: null,
      created_at: new Date().toISOString(),
    })
  }

  /** 开始一条 AI 回复（创建占位消息） */
  function startAssistantMessage(): number {
    const idx = messages.value.length
    messages.value.push({
      id: Date.now(),
      session_id: currentSessionId.value ?? '',
      role: 'assistant',
      content: '',
      thought_chain: null,
      tool_calls: null,
      created_at: new Date().toISOString(),
    })
    return idx
  }

  /** 追加内容到最近一条 AI 消息（打字机效果） */
  function appendContent(chunk: string) {
    const msgs = messages.value
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        msgs[i] = { ...msgs[i], content: msgs[i].content + chunk }
        break
      }
    }
  }

  /** 添加一个思考步骤 */
  function addThoughtStep(step: IThoughtStep) {
    thoughtChain.value.push(step)
    // 同时关联到当前 AI 消息
    const msgs = messages.value
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        const existing = msgs[i].thought_chain ?? []
        msgs[i] = {
          ...msgs[i],
          thought_chain: [...existing, step],
        }
        break
      }
    }
  }

  /** SSE done 事件：保存 session_id */
  function handleSSEDone(sessionId: string, usage?: Record<string, any>) {
    currentSessionId.value = sessionId
    isStreaming.value = false
    // 刷新会话列表以获取最新标题
    fetchSessions()
  }

  /** 开始 / 停止流式响应 */
  function setStreaming(val: boolean) {
    isStreaming.value = val
  }

  // ================================================================
  // Actions — 会话管理（调 API + 乐观更新）
  // ================================================================

  /** 删除会话 */
  async function removeSession(sessionId: string) {
    await deleteSession(sessionId)
    removeSessionLocally(sessionId)
    // 如果删除的是当前正在查看的会话，切回空白页
    if (currentSessionId.value === sessionId) {
      newChat()
    }
  }

  /** 重命名会话 */
  async function renameSession(sessionId: string, title: string) {
    await updateSessionTitle(sessionId, title)
    updateTitleLocally(sessionId, title)
    if (currentSessionId.value === sessionId) {
      currentSessionTitle.value = title
    }
  }

  return {
    // state — 会话列表
    sessions,
    isLoadingSessions,
    sessionsError,
    // state — 当前会话
    currentSessionId,
    currentSessionTitle,
    messages,
    isLoadingMessages,
    messagesError,
    // state — 流式 & 思考链
    isStreaming,
    thoughtChain,
    // getters
    hasMessages,
    hasSessions,
    lastAssistantMessage,
    // actions
    fetchSessions,
    loadSession,
    newChat,
    addUserMessage,
    startAssistantMessage,
    appendContent,
    addThoughtStep,
    handleSSEDone,
    setStreaming,
    removeSession,
    renameSession,
  }
})
