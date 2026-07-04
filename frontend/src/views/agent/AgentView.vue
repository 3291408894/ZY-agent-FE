<script setup lang="ts">
// ================================================================
// AgentView — AI 助手对话页面（完整实现）
// 对应 PBI_04：AI Agent 自然语言交互
// 对应 PBI_12：AI 思考过程可视化
//
// 布局：SessionList（左） | Chat（中） | ThoughtChainPanel（右）
// 响应式：平板以下 SessionList 和 ThoughtChainPanel 变为覆盖/折叠
// ================================================================

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAgentStore } from '@/stores/agent'
import type { SSEMessage } from '@/composables/useSSE'
import type { IThoughtStep, IToolCall } from '@/types'
import SessionList from '@/components/business/SessionList.vue'
import ChatMessage from '@/components/business/ChatMessage.vue'
import ChatInput from '@/components/business/ChatInput.vue'
import ThoughtChainPanel from '@/components/business/ThoughtChainPanel.vue'

// ================================================================
// 依赖注入
// ================================================================
const route = useRoute()
const agentStore = useAgentStore()

// ================================================================
// 本地 UI 状态
// ================================================================
const showSessionList = ref(false) // 移动端：是否显示会话列表抽屉
const showThoughtPanel = ref(false) // 移动端：是否显示思考面板
const chatContainer = ref<HTMLElement | null>(null)
const isInitialLoading = ref(true)

// ================================================================
// 计算属性
// ================================================================
/** 是否正在流式输出（优先取 store 状态，因为 cancel 后会立即变 false）*/
const isStreaming = computed(() => agentStore.isStreaming)

/** 当前展示的消息列表（包含流式中的临时消息） */
const displayMessages = computed(() => agentStore.displayMessages)

/** 当前思考链（实时） */
const currentThoughtChain = computed(() => agentStore.thoughtChain)

/** 当前工具调用（实时） */
const currentToolCalls = computed(() => agentStore.toolCalls)

/** 是否有活跃对话 */
const hasActiveChat = computed(
  () => agentStore.currentSessionId !== null || displayMessages.value.length > 0
)

/** 当前会话的消息数（不包括流式临时消息） */
const messageCount = computed(() => agentStore.currentMessages.length)

// ================================================================
// 初始化
// ================================================================
onMounted(async () => {
  await agentStore.fetchSessions()

  // 如果 URL 中有 sessionId，选中该会话
  const sessionIdFromRoute = route.params.sessionId as string | undefined
  if (sessionIdFromRoute) {
    await agentStore.selectSession(sessionIdFromRoute)
  } else if (agentStore.sessions.length > 0) {
    // 默认选中最近一个会话
    await agentStore.selectSession(agentStore.sessions[0].id)
  }

  isInitialLoading.value = false
})

// ── 流式结束后自动刷新会话列表 ──
watch(
  () => agentStore.isStreaming,
  (streaming, wasStreaming) => {
    if (wasStreaming && !streaming && agentStore.currentSessionId) {
      // 流式刚结束，刷新会话列表以获取新会话
      agentStore.fetchSessions()
    }
  }
)

// ── 消息变化时自动滚到底部 ──
watch(
  () => displayMessages.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// ── 流式内容变化时自动滚到底部 ──
watch(
  () => agentStore.streamingContent,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// ================================================================
// 会话管理
// ================================================================

/** 选中历史会话 */
async function handleSelectSession(sessionId: string) {
  showSessionList.value = false // 移动端关闭抽屉
  await agentStore.selectSession(sessionId)
  await nextTick()
  scrollToBottom()
}

/** 新建空白对话 */
function handleNewSession() {
  showSessionList.value = false
  agentStore.newSession()
}

// ================================================================
// 消息发送 & SSE 对接
// ================================================================

/** 中止控制器引用（用于取消 SSE） */
let currentAbortController: AbortController | null = null

/** 发送消息 */
async function handleSend(message: string) {
  if (!message.trim() || isStreaming.value) return

  // 如果没有当前会话，生成一个临时 ID
  const tempSessionId = agentStore.currentSessionId || `temp_${Date.now()}`

  // 添加用户消息
  agentStore.addUserMessage(message.trim(), tempSessionId)

  // 开始流式输出
  agentStore.startStreaming()

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    const token = localStorage.getItem('access_token')
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

    const controller = new AbortController()
    currentAbortController = controller

    const response = await fetch(`${baseUrl}/api/v1/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        session_id: agentStore.currentSessionId || null,
        message: message.trim(),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      let errorMsg = `请求失败 (${response.status})`
      try {
        const parsed = JSON.parse(errorBody)
        errorMsg = parsed.message || parsed.detail || errorMsg
      } catch { /* ignore */ }
      throw new Error(errorMsg)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data: SSEMessage = JSON.parse(line.slice(6))
            handleSSEMessage(data)
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    }

    // 如果循环正常结束（没有 cancel），标记流式完成
    if (!controller.signal.aborted) {
      agentStore.finishStreaming()
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      // 用户主动停止，保存已生成的内容
      agentStore.finishStreaming()
    } else {
      const errorMsg = e.message || '网络连接失败，请检查网络后重试'
      agentStore.setStreamingError(errorMsg)
      ElMessage.error(errorMsg)
    }
  } finally {
    currentAbortController = null
  }
}

/** 处理 SSE 消息 */
function handleSSEMessage(data: SSEMessage) {
  switch (data.type) {
    case 'thought':
      // PBI_12：思考步骤
      if (data.step && data.title) {
        const step: IThoughtStep = {
          step: data.step as number,
          title: data.title as string,
          content: (data.content as string) || '',
        }
        agentStore.addThought(step)
      }
      break

    case 'content':
      // 追加到主内容区（打字机效果）
      if (data.chunk) {
        agentStore.appendContent(data.chunk as string)
      }
      break

    case 'tool_call':
      // 工具调用记录
      if (data.tool_name) {
        const call: IToolCall = {
          tool_name: data.tool_name as string,
          parameters: (data.parameters as Record<string, any>) || {},
          result_summary: data.result_summary as string | undefined,
        }
        agentStore.addToolCall(call)
      }
      break

    case 'done':
      // 流式完成
      agentStore.finishStreaming({
        session_id: data.session_id as string | undefined,
        message_id: data.message_id as string | undefined,
      })
      // 更新会话标题（用首条用户消息作为标题）
      if (data.session_id && agentStore.currentMessages.length <= 2) {
        const firstUserMsg = agentStore.currentMessages.find((m) => m.role === 'user')
        if (firstUserMsg) {
          const title = firstUserMsg.content.slice(0, 30)
          agentStore.updateSessionTitle(data.session_id as string, title)
        }
      }
      break

    case 'error':
      agentStore.setStreamingError((data.message as string) || '服务器处理出错')
      ElMessage.error((data.message as string) || '服务器处理出错')
      break

    case 'progress':
      // 进度信息（习题生成等场景可复用）
      break

    default:
      break
  }
}

/** 停止生成 */
function handleStop() {
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
  // 保存已生成的部分内容
  agentStore.finishStreaming()
  ElMessage.info('已停止生成')
}

// ================================================================
// UI 辅助
// ================================================================

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function toggleSessionList() {
  showSessionList.value = !showSessionList.value
}

function toggleThoughtPanel() {
  showThoughtPanel.value = !showThoughtPanel.value
}

// ================================================================
// 清理
// ================================================================
onUnmounted(() => {
  if (currentAbortController) {
    currentAbortController.abort()
  }
  agentStore.cancelStreaming()
})
</script>

<template>
  <div class="agent-page">
    <!-- ================================================================ -->
    <!-- 页面标题栏（含移动端菜单按钮） -->
    <!-- ================================================================ -->
    <div class="page-header">
      <div class="page-header__left">
        <!-- 移动端：会话列表切换按钮 -->
        <el-button
          class="mobile-menu-btn"
          :size="'small'"
          text
          @click="toggleSessionList"
        >
          <el-icon :size="20"><Expand /></el-icon>
        </el-button>
        <div>
          <h1 class="page-header__title">AI 助手</h1>
          <p class="page-header__subtitle">
            {{ agentStore.currentSession
              ? agentStore.currentSession.title || '对话中...'
              : '与 AI 对话，智能完成学习任务'
            }}
          </p>
        </div>
      </div>
      <div class="page-header__right">
        <!-- 移动端：思考面板切换按钮 -->
        <el-badge
          :value="currentThoughtChain.length"
          :hidden="currentThoughtChain.length === 0"
          :max="99"
        >
          <el-button
            class="mobile-menu-btn"
            :size="'small'"
            text
            @click="toggleThoughtPanel"
          >
            <el-icon :size="20"><Cpu /></el-icon>
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 主体三栏布局 -->
    <!-- ================================================================ -->
    <div class="agent-body">
      <!-- ── 左侧：会话列表 ── -->
      <div
        class="agent-body__sessions"
        :class="{ 'is-visible': showSessionList }"
      >
        <!-- 移动端遮罩 -->
        <div
          class="sessions-overlay"
          @click="showSessionList = false"
        ></div>
        <div class="sessions-panel">
          <SessionList
            @select="handleSelectSession"
            @new="handleNewSession"
          />
        </div>
      </div>

      <!-- ── 中间：对话区 ── -->
      <div class="agent-body__chat" :class="{ 'has-thought-panel': showThoughtPanel || (currentThoughtChain.length > 0 && !isStreaming && messageCount > 0) }">
        <!-- 空状态：无会话无消息 -->
        <div v-if="!hasActiveChat && !isInitialLoading" class="chat-empty">
          <div class="chat-empty__icon">🤖</div>
          <h2 class="chat-empty__title">你好，我是智翼 AI 助手</h2>
          <p class="chat-empty__desc">
            我可以帮你总结课文、生成习题、解析知识点、构建知识图谱
          </p>
          <div class="chat-empty__examples">
            <h3 class="chat-empty__examples-title">试试这样问我：</h3>
            <div class="chat-empty__example-list">
              <div
                v-for="example in [
                  '帮我总结《桃花源记》的主要内容',
                  '给我出 5 道七年级数学一元一次方程练习题',
                  '解释光合作用的原理，并画出知识图谱',
                  '《背影》中作者几次写到背影？各有什么含义？',
                ]"
                :key="example"
                class="chat-empty__example-item"
                @click="handleSend(example)"
              >
                {{ example }}
              </div>
            </div>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-else-if="isInitialLoading" class="chat-loading">
          <el-icon class="is-loading" :size="28"><Loading /></el-icon>
          <span>加载对话数据...</span>
        </div>

        <!-- 消息列表 -->
        <div v-else ref="chatContainer" class="chat-messages">
          <!-- 历史消息提示 -->
          <div v-if="messageCount > 0 && !isStreaming" class="chat-history-hint">
            <span>— 历史对话 —</span>
          </div>

          <ChatMessage
            v-for="msg in displayMessages"
            :key="msg.id"
            :message="msg"
            :is-streaming="isStreaming && msg.id === '__streaming__'"
          />

          <!-- 流式错误提示 -->
          <div v-if="agentStore.streamingError" class="chat-error">
            <el-alert
              :title="agentStore.streamingError"
              type="error"
              :closable="true"
              show-icon
              @close="agentStore.streamingError = null"
            />
            <el-button
              type="primary"
              :size="'small'"
              style="margin-top: 8px;"
              @click="handleSend(displayMessages[displayMessages.length - 2]?.content || '')"
            >
              <el-icon :size="14"><Refresh /></el-icon>
              重新发送
            </el-button>
          </div>

          <!-- 流式输出中的加载占位（还没收到第一个 chunk 时） -->
          <div v-if="isStreaming && !agentStore.streamingContent && !agentStore.streamingError" class="chat-thinking">
            <div class="chat-thinking__dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <span class="chat-thinking__text">AI 正在思考...</span>
          </div>
        </div>

        <!-- 输入区 -->
        <ChatInput
          :is-streaming="isStreaming"
          @send="handleSend"
          @stop="handleStop"
        />
      </div>

      <!-- ── 右侧：思考链面板 ── -->
      <div
        class="agent-body__thoughts"
        :class="{ 'is-visible': showThoughtPanel }"
      >
        <ThoughtChainPanel
          :steps="currentThoughtChain"
          :tool-calls="currentToolCalls"
          :is-streaming="isStreaming"
          :is-history="!isStreaming && messageCount > 0"
          @toggle="() => {}"
        />
        <!-- 无当前思考链但正在对话中时，显示占位 -->
        <div
          v-if="currentThoughtChain.length === 0 && currentToolCalls.length === 0 && !isStreaming"
          class="thoughts-placeholder"
        >
          <div class="thoughts-placeholder__icon">🧠</div>
          <p class="thoughts-placeholder__text">
            {{ messageCount > 0 ? '点击消息中的「思考过程」查看详情' : '发送消息后，这里将展示 AI 的思考过程' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// Agent 页面整体布局
// ================================================================
.agent-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);
  max-width: 1400px;
  margin: 0 auto;
  overflow: hidden;
}

// ── 页面标题栏 ──
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-base);
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--line-height-heading);
  }

  &__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    margin: 2px 0 0;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.mobile-menu-btn {
  display: none;
}

// ================================================================
// 三栏布局主体
// ================================================================
.agent-body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--spacing-base);

  // ── 左侧：会话列表 ──
  &__sessions {
    width: 260px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border-light);
  }

  // ── 中间：对话区 ──
  &__chat {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    overflow: hidden;
  }

  // ── 右侧：思考链面板 ──
  &__thoughts {
    width: 300px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
  }
}

// ── 会话列表面板包装 ──
.sessions-panel {
  height: 100%;
}

// ── 思考面板占位 ──
.thoughts-placeholder {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-base);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  opacity: 0.7;

  &__icon {
    font-size: 28px;
    margin-bottom: var(--spacing-sm);
  }

  &__text {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    line-height: var(--line-height-base);
    margin: 0;
  }
}

// ================================================================
// 空状态
// ================================================================
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxxl) var(--spacing-xl);
  text-align: center;

  &__icon {
    font-size: 56px;
    margin-bottom: var(--spacing-lg);
  }

  &__title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
  }

  &__desc {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xl);
    max-width: 420px;
  }

  &__examples {
    width: 100%;
    max-width: 480px;
  }

  &__examples-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-md);
    font-weight: var(--font-weight-medium);
  }

  &__example-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__example-item {
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-bg);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-align: left;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-lighter);
      color: var(--color-primary);
    }
  }
}

// ── 加载中 ──
.chat-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--color-text-placeholder);
  font-size: var(--font-size-sm);
}

// ================================================================
// 消息列表
// ================================================================
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-base) var(--spacing-lg);
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
}

// ── 历史消息分隔 ──
.chat-history-hint {
  text-align: center;
  padding: var(--spacing-sm) 0 var(--spacing-base);

  span {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }
}

// ── 思考中动画 ──
.chat-thinking {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-base) 0;

  &__dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
    animation: dot-bounce 1.4s ease-in-out infinite both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0s;
    }
  }

  &__text {
    font-size: var(--font-size-sm);
    color: var(--color-text-placeholder);
  }
}

// ── 错误提示 ──
.chat-error {
  padding: var(--spacing-base) 0;
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// ================================================================
// 响应式：平板及以下
// ================================================================
@media (max-width: 1024px) {
  .agent-body {
    &__sessions {
      width: 240px;
    }

    &__thoughts {
      width: 260px;
    }
  }
}

@media (max-width: 768px) {
  .agent-page {
    height: calc(100vh - var(--header-height) - var(--page-padding) * 2);
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .agent-body {
    gap: 0;

    // 会话列表：移动端变为左侧滑出抽屉
    &__sessions {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: var(--z-overlay);
      width: 280px;
      transform: translateX(-100%);
      transition: transform var(--transition-base);
      border-radius: 0;
      border: none;

      &.is-visible {
        transform: translateX(0);
      }
    }

    .sessions-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: -1;

      .agent-body__sessions.is-visible & {
        display: block;
      }
    }

    .sessions-panel {
      height: 100%;
      background: var(--color-bg-sidebar);
      box-shadow: var(--shadow-lg);
    }

    // 思考面板：移动端变为底部滑出
    &__thoughts {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: var(--z-overlay);
      width: 100%;
      max-height: 50vh;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform var(--transition-base);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      box-shadow: var(--shadow-lg);

      &.is-visible {
        transform: translateY(0);
      }
    }

    // 对话区占满
    &__chat {
      border-radius: var(--radius-md);
    }
  }

  .chat-messages {
    padding: var(--spacing-sm) var(--spacing-base);
  }
}
</style>
