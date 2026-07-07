<script setup lang="ts">
// ================================================================
// AgentView — AI 助手对话页面
// 对应 PBI_04：AI Agent 自然语言交互
// 对应 PBI_12：AI 思考过程可视化
//
// 布局：左侧 ChatHistory 侧边栏 + 右侧对话区
// ================================================================

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAgentStore } from '@/stores/agent'
import { ChatHistory } from '@/components/business'
import type { IThoughtStep } from '@/types'
import { simulateSSE, isMockEnabled } from '@/api/mock/agentMock'

// ── Router ──
const route = useRoute()
const router = useRouter()

// ── Store ──
const agentStore = useAgentStore()

// ── 本地状态 ──
const inputMessage = ref('')
const chatContainerRef = ref<HTMLElement | null>(null)
const abortController = ref<AbortController | null>(null)

// ── 思考链面板折叠 ──
const thoughtPanelCollapsed = ref(true)

// ── 从 Store 解构状态（保持响应性） ──
const messages = computed(() => agentStore.messages)
const isStreaming = computed(() => agentStore.isStreaming)
const thoughtChain = computed(() => agentStore.thoughtChain)
const isLoadingMessages = computed(() => agentStore.isLoadingMessages)
const messagesError = computed(() => agentStore.messagesError)

// ================================================================
// SSE 流式请求
// ================================================================
// ================================================================
// SSE 流式请求（优先真实后端，失败自动 fallback 到 Mock）
// ================================================================
let useMock = isMockEnabled()

async function connectSSE(sessionId: string | null, message: string) {
  const token = localStorage.getItem('access_token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  const controller = new AbortController()
  abortController.value = controller

  agentStore.setStreaming(true)
  agentStore.thoughtChain = []

  // 添加 AI 占位消息
  agentStore.startAssistantMessage()

  // ── 尝试真实 SSE ──
  if (!useMock) {
    try {
      await realSSE(baseUrl, token, sessionId, message, controller)
      return
    } catch (e: any) {
      if (e.name === 'AbortError') {
        agentStore.setStreaming(false)
        return
      }
      // 网络错误 → 自动切换 Mock
      console.warn('后端不可用，自动切换到 Mock 模式:', e.message)
      ElMessage.warning('后端未启动，使用 Mock 模式演示')
      useMock = true
      localStorage.setItem('zhiyi-use-mock', '1')
      // 清除失败时残留的空 AI 消息
      const msgs = agentStore.messages
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && msgs[msgs.length - 1].content === '') {
        msgs.pop()
      }
      agentStore.startAssistantMessage()
      agentStore.thoughtChain = []
    }
  }

  // ── Mock SSE ──
  try {
    await simulateSSE(
      message,
      {
        onThought: (step: IThoughtStep) => {
          agentStore.addThoughtStep(step)
        },
        onContent: (chunk: string) => {
          agentStore.appendContent(chunk)
          scrollToBottom()
        },
        onDone: (newSessionId: string) => {
          agentStore.handleSSEDone(newSessionId)
          router.replace({ name: 'AgentSession', params: { sessionId: newSessionId } })
        },
      },
      controller.signal
    )
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      ElMessage.error('Mock 响应异常')
    }
  } finally {
    agentStore.setStreaming(false)
    abortController.value = null
    scrollToBottom()
  }
}

/** 真实 SSE 请求 */
async function realSSE(
  baseUrl: string,
  token: string | null,
  sessionId: string | null,
  message: string,
  controller: AbortController
) {
  const response = await fetch(`${baseUrl}/api/v1/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ session_id: sessionId, message }),
    signal: controller.signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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
          const data = JSON.parse(line.slice(6))
          handleSSEEvent(data)
        } catch { /* skip */ }
      }
    }
  }
}

/** 处理 SSE 事件 */
function handleSSEEvent(data: any) {
  switch (data.type) {
    case 'thought':
      // PBI_12: 思考步骤 → 展开面板
      thoughtPanelCollapsed.value = false
      const step: IThoughtStep = {
        step: data.step ?? agentStore.thoughtChain.length + 1,
        title: data.title ?? '',
        content: data.content ?? data.description ?? '',
      }
      agentStore.addThoughtStep(step)
      break

    case 'content':
      // 追加到 AI 消息（打字机效果）
      agentStore.appendContent(data.chunk || '')
      scrollToBottom()
      break

    case 'done':
      // 对话完成：保存 session_id，刷新列表
      const sessionId = data.session_id
      if (sessionId) {
        agentStore.handleSSEDone(sessionId)
        // 更新 URL（不触发页面刷新）
        router.replace({ name: 'AgentSession', params: { sessionId } })
      } else {
        agentStore.setStreaming(false)
      }
      break

    case 'error':
      ElMessage.error(data.message || '发生未知错误')
      agentStore.setStreaming(false)
      break
  }
}

// ================================================================
// 发送消息
// ================================================================
async function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content || isStreaming.value) return

  inputMessage.value = ''
  thoughtPanelCollapsed.value = true

  // 添加用户消息到列表
  agentStore.addUserMessage(content)

  // 如果当前没有会话（新建对话），不需要 session_id
  const sessionId = agentStore.currentSessionId

  await nextTick()
  scrollToBottom()

  // 发起 SSE 请求
  await connectSSE(sessionId, content)
}

/** 停止生成 */
function stopStreaming() {
  abortController.value?.abort()
  abortController.value = null
  agentStore.setStreaming(false)
  ElMessage.info('已停止生成')
}

// ================================================================
// 会话操作回调
// ================================================================
function handleSelectSession(sessionId: string) {
  router.push({ name: 'AgentSession', params: { sessionId } })
}

async function handleDeleteSession(sessionId: string) {
  try {
    await agentStore.removeSession(sessionId)
    ElMessage.success('会话已删除')
    if (agentStore.currentSessionId === null) {
      router.push({ name: 'Agent' })
    }
  } catch {
    ElMessage.error('删除失败，请重试')
  }
}

async function handleRenameSession(sessionId: string, title: string) {
  try {
    await agentStore.renameSession(sessionId, title)
    ElMessage.success('标题已更新')
  } catch {
    ElMessage.error('重命名失败，请重试')
  }
}

function handleNewChat() {
  stopStreaming()
  agentStore.newChat()
  router.push({ name: 'Agent' })
}

// ================================================================
// 键盘快捷键：Enter 发送，Shift+Enter 换行
// ================================================================
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ================================================================
// 滚动到底部
// ================================================================
function scrollToBottom() {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// ================================================================
// 格式化消息内容（简单文本处理，后续可集成 Markdown 渲染）
// ================================================================
function formatMessage(content: string): string {
  if (!content) return ''
  // 转义 HTML（简单安全处理）
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 保留换行
    .replace(/\n/g, '<br>')
}

// ================================================================
// 初始化
// ================================================================
onMounted(async () => {
  // 加载会话列表
  await agentStore.fetchSessions()

  // 如果路由有 sessionId，加载对应会话
  const sessionId = route.params.sessionId as string | undefined
  if (sessionId) {
    await agentStore.loadSession(sessionId)
    nextTick(() => scrollToBottom())
  }
})

// 监听路由参数变化（从 ChatHistory 点击触发）
watch(
  () => route.params.sessionId,
  async (newId) => {
    const sid = newId as string | undefined
    if (sid && sid !== agentStore.currentSessionId) {
      await agentStore.loadSession(sid)
      nextTick(() => scrollToBottom())
    } else if (!sid) {
      agentStore.newChat()
    }
  }
)

// 组件卸载时断开 SSE
onUnmounted(() => {
  stopStreaming()
})
</script>

<template>
  <div class="agent-page">
    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 左侧：会话历史侧边栏 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <ChatHistory
      :sessions="agentStore.sessions"
      :current-session-id="agentStore.currentSessionId"
      :loading="agentStore.isLoadingSessions"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
      @rename-session="handleRenameSession"
      @new-chat="handleNewChat"
    />

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 右侧：对话区 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="agent-chat">
      <!-- ── 顶部：当前会话标题 ── -->
      <div class="chat-header">
        <h2 class="chat-header__title">{{ agentStore.currentSessionTitle }}</h2>
        <span v-if="isStreaming" class="chat-header__status">
          <span class="pulse-dot"></span>
          生成中...
        </span>
      </div>

      <!-- ── 中间：消息列表 ── -->
      <div
        ref="chatContainerRef"
        class="chat-messages"
        :class="{ 'chat-messages--loading': isLoadingMessages }"
      >
        <!-- 加载历史消息 -->
        <div v-if="isLoadingMessages" class="chat-messages__loading">
          <el-icon class="is-loading" :size="24"><Loading /></el-icon>
          <p>加载消息中...</p>
        </div>

        <!-- 加载错误 -->
        <el-alert
          v-else-if="messagesError"
          :title="messagesError"
          type="error"
          show-icon
          :closable="true"
          class="chat-messages__error"
          @close="agentStore.messagesError = null"
        />

        <!-- 空状态：引导文案 -->
        <div v-else-if="!isLoadingMessages && messages.length === 0" class="chat-messages__empty">
          <div class="empty-state">
            <div class="empty-state__icon">
              <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="36" fill="var(--color-primary-light)" />
                <path
                  d="M40 20C32 32 24 38 20 44C16 50 20 58 40 58C60 58 64 50 60 44C56 38 48 32 40 20Z"
                  fill="var(--color-primary)"
                  opacity="0.6"
                />
                <circle cx="32" cy="42" r="3" fill="white" />
                <circle cx="48" cy="42" r="3" fill="white" />
              </svg>
            </div>
            <h3>智翼 AI 助手</h3>
            <p>和 AI 对话，智能完成学习任务</p>
            <div class="empty-state__hints">
              <span>试试说：</span>
              <div class="hint-chips">
                <button
                  v-for="hint in [
                    '帮我总结《桃花源记》的主要内容',
                    '给我出 5 道数学二次函数题',
                    '文言文《出师表》的创作背景',
                  ]"
                  :key="hint"
                  class="hint-chip"
                  @click="inputMessage = hint; sendMessage()"
                >
                  {{ hint }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <template v-else>
          <!-- ══════════════════════════════════════════════════════ -->
          <!-- 思考链面板（PBI_12） -->
          <!-- ══════════════════════════════════════════════════════ -->
          <div
            v-if="thoughtChain.length > 0"
            class="thought-panel"
            :class="{ 'is-collapsed': thoughtPanelCollapsed }"
          >
            <button
              class="thought-panel__toggle"
              @click="thoughtPanelCollapsed = !thoughtPanelCollapsed"
            >
              <el-icon :size="16">
                <component :is="thoughtPanelCollapsed ? 'ArrowRight' : 'ArrowDown'" />
              </el-icon>
              <span>AI 思考过程（{{ thoughtChain.length }} 步）</span>
            </button>
            <div v-show="!thoughtPanelCollapsed" class="thought-panel__steps">
              <div
                v-for="step in thoughtChain"
                :key="step.step"
                class="thought-step"
              >
                <div class="thought-step__header">
                  <span class="thought-step__index">{{ step.step }}</span>
                  <span class="thought-step__title">{{ step.title }}</span>
                </div>
                <p class="thought-step__content">{{ step.content }}</p>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════ -->
          <!-- 对话消息 -->
          <!-- ══════════════════════════════════════════════════════ -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-message"
            :class="`chat-message--${msg.role}`"
          >
            <!-- 用户消息 -->
            <template v-if="msg.role === 'user'">
              <div class="chat-message__bubble chat-message__bubble--user">
                <p v-html="formatMessage(msg.content)"></p>
              </div>
            </template>

            <!-- AI 消息 -->
            <template v-else>
              <div class="chat-message__bubble chat-message__bubble--assistant">
                <!-- 关联的思考链（每条 AI 消息自己的 thought_chain） -->
                <details
                  v-if="msg.thought_chain && msg.thought_chain.length > 0"
                  class="chat-message__thoughts"
                >
                  <summary>思考过程（{{ msg.thought_chain.length }} 步）</summary>
                  <div
                    v-for="ts in msg.thought_chain"
                    :key="ts.step"
                    class="mini-thought"
                  >
                    <strong>{{ ts.title }}</strong>
                    <span>{{ ts.content }}</span>
                  </div>
                </details>

                <!-- 消息内容 -->
                <div
                  v-if="msg.content"
                  class="chat-message__text"
                  v-html="formatMessage(msg.content)"
                ></div>

                <!-- 流式响应中：打字光标 -->
                <span
                  v-if="isStreaming && msg === messages[messages.length - 1]"
                  class="typing-cursor"
                >|</span>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- ── 底部：输入区 ── -->
      <div class="chat-input">
        <div class="chat-input__wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="2"
            placeholder="输入你的问题，Shift+Enter 换行，Enter 发送"
            resize="none"
            :disabled="isStreaming"
            @keydown="handleKeydown"
          />
          <div class="chat-input__actions">
            <el-button
              v-if="!isStreaming"
              type="primary"
              :disabled="!inputMessage.trim()"
              @click="sendMessage"
            >
              <el-icon :size="16"><Promotion /></el-icon>
              发送
            </el-button>
            <el-button
              v-else
              type="danger"
              @click="stopStreaming"
            >
              <el-icon :size="16"><VideoPause /></el-icon>
              停止生成
            </el-button>
          </div>
        </div>
        <p class="chat-input__hint">
          智翼 AI 助手 — AI 生成内容仅供参考，请结合实际教材学习
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 整体布局：双栏（侧边栏 + 对话区）
// ================================================================
.agent-page {
  display: flex;
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);
  max-width: 1200px;
  margin: calc(-1 * var(--page-padding));
  margin-bottom: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-base);
}

// ================================================================
// 右侧对话区
// ================================================================
.agent-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

// ── 顶部标题栏 ──
.chat-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-base) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-card);

  &__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    flex-shrink: 0;
  }
}

// 脉冲小点
.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

// ── 消息列表 ──
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-base) var(--spacing-xl);

  &--loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__loading,
  &__error {
    margin: auto;
  }

  &__error {
    margin: var(--spacing-lg);
  }

  // ── 空状态 ──
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.empty-state {
  text-align: center;
  max-width: 480px;

  &__icon {
    margin-bottom: var(--spacing-lg);

    svg {
      width: 80px;
      height: 80px;
    }
  }

  h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
  }

  &__hints {
    span {
      font-size: var(--font-size-sm);
      color: var(--color-text-placeholder);
      display: block;
      margin-bottom: var(--spacing-sm);
    }
  }
}

.hint-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.hint-chip {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-lighter);
  }
}

// ── 思考链面板 ──
.thought-panel {
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-primary-lighter);
  overflow: hidden;

  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-base);
    border: none;
    background: none;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-primary-light);
    }
  }

  &__steps {
    padding: 0 var(--spacing-base) var(--spacing-md);
  }
}

.thought-step {
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--color-border-lighter);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
  }

  &__index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 11px;
    font-weight: var(--font-weight-bold);
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__content {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-left: 28px;
    line-height: var(--line-height-base);
  }
}

// ── 消息气泡 ──
.chat-message {
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;

  &--user {
    align-items: flex-end;
  }

  &--assistant {
    align-items: flex-start;
  }

  &__bubble {
    max-width: 80%;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    word-break: break-word;

    &--user {
      background: var(--color-primary-light);
      color: var(--color-text-primary);
      border-bottom-right-radius: var(--radius-sm);
    }

    &--assistant {
      background: var(--color-bg);
      color: var(--color-text);
      border: 1px solid var(--color-border-light);
      border-bottom-left-radius: var(--radius-sm);
    }
  }

  &__thoughts {
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-sm);

    summary {
      cursor: pointer;
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--spacing-xs);
    }
  }

  &__text {
    p {
      margin: 0;
    }
  }
}

.mini-thought {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
  border-left: 2px solid var(--color-border);

  strong {
    color: var(--color-text-secondary);
    margin-right: var(--spacing-xs);
  }
}

// ── 打字光标 ──
.typing-cursor {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

@keyframes blink {
  50% { opacity: 0; }
}

// ── 底部输入区 ──
.chat-input {
  padding: var(--spacing-base) var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-card);

  &__wrapper {
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-end;
  }

  &__actions {
    flex-shrink: 0;
  }

  &__hint {
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    text-align: center;
  }
}

// ================================================================
// 响应式：平板及以下隐藏侧边栏
// ================================================================
@media (max-width: 768px) {
  .agent-page {
    border-radius: 0;
    box-shadow: none;
    height: calc(100vh - var(--header-height) - var(--footer-height));
    margin: calc(-1 * var(--spacing-base));
  }

  .chat-messages {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  .chat-input {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  .chat-message__bubble {
    max-width: 90%;
  }
}
</style>
