// ================================================================
// 智翼 (ZhiYi) — AI Agent 状态管理 (Pinia Store)
// 对应 PBI_04：AI Agent 自然语言交互
// 对应 PBI_12：AI 思考过程可视化
// ================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IChatSession, IChatMessage, IThoughtStep, IToolCall } from '@/types'
import { getSessions, getSessionMessages, deleteSession } from '@/api/modules/agent'

export const useAgentStore = defineStore('agent', () => {
  // ================================================================
  // State — 持久数据
  // ================================================================
  const sessions = ref<IChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  /** sessionId → messages[] 映射，避免重复请求 */
  const messagesCache = ref<Record<string, IChatMessage[]>>({})
  const isLoadingSessions = ref(false)
  const isLoadingMessages = ref(false)

  // ================================================================
  // State — 流式状态（当前正在进行的 SSE 数据）
  // ================================================================
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const thoughtChain = ref<IThoughtStep[]>([])
  const toolCalls = ref<IToolCall[]>([])
  const streamingError = ref<string | null>(null)

  // ================================================================
  // Getters
  // ================================================================
  const currentSession = computed(() =>
    sessions.value.find((s) => s.id === currentSessionId.value) ?? null
  )

  const currentMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messagesCache.value[currentSessionId.value] ?? []
  })

  const hasSessions = computed(() => sessions.value.length > 0)

  /** 当前会话的消息 + 正在流式输出的临时消息 */
  const displayMessages = computed(() => {
    const msgs = [...currentMessages.value]
    // 如果在流式输出中且有内容，追加一条临时 assistant 消息供 UI 渲染
    if (isStreaming.value && streamingContent.value) {
      msgs.push({
        id: '__streaming__',
        session_id: currentSessionId.value ?? '',
        role: 'assistant',
        content: streamingContent.value,
        thought_chain: thoughtChain.value.length > 0 ? [...thoughtChain.value] : undefined,
        tool_calls: toolCalls.value.length > 0 ? [...toolCalls.value] : undefined,
        created_at: new Date().toISOString(),
      })
    }
    return msgs
  })

  // ================================================================
  // Actions — 会话管理
  // ================================================================

  /** 获取会话列表 */
  async function fetchSessions() {
    isLoadingSessions.value = true
    try {
      const data = await getSessions()
      sessions.value = Array.isArray(data) ? data : []
    } catch {
      sessions.value = []
    } finally {
      isLoadingSessions.value = false
    }
  }

  /** 获取会话历史消息 */
  async function fetchMessages(sessionId: string) {
    isLoadingMessages.value = true
    try {
      const data = await getSessionMessages(sessionId)
      messagesCache.value[sessionId] = Array.isArray(data) ? data : []
    } catch {
      messagesCache.value[sessionId] = []
    } finally {
      isLoadingMessages.value = false
    }
  }

  /** 选中会话并加载消息 */
  async function selectSession(sessionId: string) {
    // 如果正在流式输出，先取消
    if (isStreaming.value) {
      cancelStreaming()
    }

    currentSessionId.value = sessionId

    // 如果缓存中没有该会话的消息，则请求
    if (!messagesCache.value[sessionId]) {
      await fetchMessages(sessionId)
    }
  }

  /** 删除会话 */
  async function removeSession(sessionId: string) {
    try {
      await deleteSession(sessionId)
    } catch {
      // 即使后端请求失败，也从前端列表移除
    }
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
    delete messagesCache.value[sessionId]

    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      clearStreamingState()
    }
  }

  /** 添加新会话到列表首部（创建会话后调用） */
  function addSession(session: IChatSession) {
    sessions.value.unshift(session)
  }

  /** 更新会话标题（首条消息完成后调用） */
  function updateSessionTitle(sessionId: string, title: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session) {
      session.title = title
    }
  }

  /** 新建空白会话 */
  function newSession() {
    if (isStreaming.value) {
      cancelStreaming()
    }
    currentSessionId.value = null
    clearStreamingState()
  }

  // ================================================================
  // Actions — 流式消息
  // ================================================================

  /** 添加用户消息到缓存（同时若为新会话则创建临时 session id） */
  function addUserMessage(content: string, tempSessionId?: string) {
    if (tempSessionId) {
      currentSessionId.value = tempSessionId
    }

    const userMsg: IChatMessage = {
      id: `user_${Date.now()}`,
      session_id: currentSessionId.value ?? '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    if (currentSessionId.value) {
      if (!messagesCache.value[currentSessionId.value]) {
        messagesCache.value[currentSessionId.value] = []
      }
      messagesCache.value[currentSessionId.value].push(userMsg)
    }

    return userMsg
  }

  /** 开始流式输出 */
  function startStreaming() {
    isStreaming.value = true
    streamingContent.value = ''
    thoughtChain.value = []
    toolCalls.value = []
    streamingError.value = null
  }

  /** 追加流式文本（打字机效果） */
  function appendContent(chunk: string) {
    streamingContent.value += chunk
  }

  /** 添加思考步骤（PBI_12） */
  function addThought(step: IThoughtStep) {
    // 如果同 step 号已存在则更新，否则追加
    const idx = thoughtChain.value.findIndex((t) => t.step === step.step)
    if (idx >= 0) {
      thoughtChain.value[idx] = step
    } else {
      thoughtChain.value.push(step)
    }
  }

  /** 添加工具调用记录（PBI_12） */
  function addToolCall(call: IToolCall) {
    toolCalls.value.push(call)
  }

  /** 流式完成：将临时流式内容固化为正式消息 */
  function finishStreaming(data?: {
    session_id?: string
    message_id?: string
  }) {
    isStreaming.value = false

    // 如果流式期间产生了内容，将其保存到消息缓存
    if (streamingContent.value && currentSessionId.value) {
      const sid = data?.session_id || currentSessionId.value
      const assistantMsg: IChatMessage = {
        id: data?.message_id || `msg_${Date.now()}`,
        session_id: sid,
        role: 'assistant',
        content: streamingContent.value,
        thought_chain:
          thoughtChain.value.length > 0 ? [...thoughtChain.value] : undefined,
        tool_calls:
          toolCalls.value.length > 0 ? [...toolCalls.value] : undefined,
        created_at: new Date().toISOString(),
      }

      if (!messagesCache.value[sid]) {
        messagesCache.value[sid] = []
      }
      messagesCache.value[sid].push(assistantMsg)

      // 如果后端返回了正式 session_id，同步更新
      if (data?.session_id && currentSessionId.value !== data.session_id) {
        // 迁移消息到正式 session_id
        if (
          messagesCache.value[currentSessionId.value] &&
          currentSessionId.value !== data.session_id
        ) {
          messagesCache.value[data.session_id] = [
            ...(messagesCache.value[data.session_id] || []),
            ...messagesCache.value[currentSessionId.value],
          ]
          delete messagesCache.value[currentSessionId.value]
        }
        currentSessionId.value = data.session_id
      }
    }

    // 不清空 thoughtChain 和 toolCalls，它们会随着消息保存
  }

  /** 取消流式输出 */
  function cancelStreaming() {
    isStreaming.value = false
  }

  /** 清空所有流式状态 */
  function clearStreamingState() {
    isStreaming.value = false
    streamingContent.value = ''
    thoughtChain.value = []
    toolCalls.value = []
    streamingError.value = null
  }

  /** 设置流式错误 */
  function setStreamingError(error: string) {
    streamingError.value = error
    isStreaming.value = false
  }

  return {
    // state — 持久
    sessions,
    currentSessionId,
    messagesCache,
    isLoadingSessions,
    isLoadingMessages,
    // state — 流式
    isStreaming,
    streamingContent,
    thoughtChain,
    toolCalls,
    streamingError,
    // getters
    currentSession,
    currentMessages,
    displayMessages,
    hasSessions,
    // actions — 会话
    fetchSessions,
    fetchMessages,
    selectSession,
    removeSession,
    addSession,
    updateSessionTitle,
    newSession,
    // actions — 流式
    addUserMessage,
    startStreaming,
    appendContent,
    addThought,
    addToolCall,
    finishStreaming,
    cancelStreaming,
    clearStreamingState,
    setStreamingError,
  }
})
