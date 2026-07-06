<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAgentStore } from '@/stores/agent'
import SessionList from '@/components/business/SessionList.vue'
import ChatMessage from '@/components/business/ChatMessage.vue'
import ChatInput from '@/components/business/ChatInput.vue'
import ThoughtChainPanel from '@/components/business/ThoughtChainPanel.vue'

const route = useRoute()
const agentStore = useAgentStore()

const chatContainer = ref<HTMLElement>()
const showThoughtPanel = ref(false)
const abortController = ref<AbortController | null>(null)

// ── 初始化 ──
onMounted(async () => {
  await agentStore.fetchSessions()
  const sid = route.params.sessionId as string
  if (sid) {
    await agentStore.selectSession(sid)
  } else if (agentStore.sessions.length > 0) {
    await agentStore.selectSession(agentStore.sessions[0].id)
  }
})

// 自动滚动到底部
watch(() => agentStore.displayMessages.length, () => {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
})

// ── 发送消息 ──
async function handleSend(message: string) {
  if (!message.trim() || agentStore.isStreaming) return

  // 无 session 时创建临时 ID
  if (!agentStore.currentSessionId) {
    agentStore.currentSessionId = 'temp-' + Date.now()
  }

  // 添加用户消息到缓存
  const sid = agentStore.currentSessionId
  if (!agentStore.messagesCache[sid]) agentStore.messagesCache[sid] = []
  agentStore.messagesCache[sid].push({
    id: 'u-' + Date.now(), session_id: sid, role: 'user',
    content: message, created_at: new Date().toISOString(),
  })

  // 启动流式
  agentStore.isStreaming = true
  agentStore.streamingContent = ''
  agentStore.thoughtChain = []
  agentStore.toolCalls = []
  agentStore.streamingError = null
  showThoughtPanel.value = true

  const controller = new AbortController()
  abortController.value = controller

  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'text/event-stream' },
      body: JSON.stringify({ session_id: agentStore.currentSessionId === 'temp-' ? null : agentStore.currentSessionId, message }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          switch (evt.type) {
            case 'thought': agentStore.addThought(evt as any); break
            case 'tool_call': agentStore.addToolCall(evt as any); break
            case 'content': agentStore.streamingContent += evt.chunk || ''; break
            case 'done':
              if (evt.session_id) {
                const newSid: string = evt.session_id
                agentStore.currentSessionId = newSid
                if (!agentStore.messagesCache[newSid]) agentStore.messagesCache[newSid] = []
                agentStore.messagesCache[newSid].push({
                  id: 'a-' + Date.now(), session_id: newSid,
                  role: 'assistant', content: agentStore.streamingContent,
                  thought_chain: [...agentStore.thoughtChain],
                  tool_calls: [...agentStore.toolCalls],
                  created_at: new Date().toISOString(),
                })
                await agentStore.fetchSessions()
              }
              agentStore.isStreaming = false
              break
            case 'error':
              agentStore.streamingError = evt.message || '请求失败'
              agentStore.isStreaming = false
              break
          }
        } catch { /* skip malformed */ }
      }
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') agentStore.streamingError = e.message || '连接失败'
  } finally {
    agentStore.isStreaming = false
    abortController.value = null
  }
}

function handleStop() {
  abortController.value?.abort()
  agentStore.isStreaming = false
}

function handleSelectSession(sid: string) { agentStore.selectSession(sid) }
function handleNewSession() {
  handleStop()
  agentStore.currentSessionId = null
  agentStore.streamingContent = ''
  agentStore.thoughtChain = []
  agentStore.toolCalls = []
  showThoughtPanel.value = false
}
</script>

<template>
  <div class="agent">
    <!-- 三栏布局 -->
    <div class="agent__panels">
      <!-- 左侧：会话列表 -->
      <aside class="agent__sessions">
        <SessionList @select="handleSelectSession" @new="handleNewSession" />
      </aside>

      <!-- 中间：对话区 -->
      <main class="agent__chat">
        <div class="chat-messages" ref="chatContainer">
          <div v-if="agentStore.displayMessages.length === 0" class="empty-state" style="padding-top:80px">
            <div class="empty-state__icon">💬</div>
            <div class="empty-state__text">开始和 AI 助手对话吧</div>
            <p style="color:var(--color-text-placeholder);font-size:var(--font-size-sm);margin-top:var(--spacing-sm)">
              试试说："帮我总结《背影》这篇课文" 或 "给我出 5 道一元二次方程题"
            </p>
          </div>
          <ChatMessage
            v-for="msg in agentStore.displayMessages"
            :key="msg.id"
            :message="msg"
            :is-streaming="msg.id === '__streaming__'"
          />
        </div>
        <div class="chat-input-area">
          <ChatInput
            :is-streaming="agentStore.isStreaming"
            @send="handleSend"
            @stop="handleStop"
          />
        </div>
      </main>

      <!-- 右侧：思考链 -->
      <aside v-if="showThoughtPanel" class="agent__thought">
        <ThoughtChainPanel
          :steps="agentStore.thoughtChain"
          :tool-calls="agentStore.toolCalls"
          :is-streaming="agentStore.isStreaming"
          @toggle="showThoughtPanel = !showThoughtPanel"
        />
      </aside>
    </div>

    <!-- 思考链切换按钮（移动端） -->
    <el-button
      v-if="!showThoughtPanel && agentStore.thoughtChain.length > 0"
      class="thought-toggle"
      type="primary"
      circle
      @click="showThoughtPanel = true"
    >
      <el-icon :size="18"><Cpu /></el-icon>
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.agent {
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);
  min-height: 500px;
  &__panels { display:flex; height:100%; gap:1px; background:var(--color-border-light); border-radius:var(--radius-lg); overflow:hidden; }
  &__sessions { width:260px; flex-shrink:0; background:var(--color-bg-card); overflow-y:auto;
    @media(max-width:1024px){ display:none; }
  }
  &__chat { flex:1; display:flex; flex-direction:column; background:var(--color-bg-card); min-width:0; }
  &__thought { width:320px; flex-shrink:0; background:var(--color-bg-card); overflow-y:auto;
    @media(max-width:1280px){ display:none; }
  }
}

.chat-messages { flex:1; overflow-y:auto; padding:var(--spacing-base); }
.chat-input-area { padding:var(--spacing-base); border-top:1px solid var(--color-border-light); background:var(--color-bg-card); }

.thought-toggle { position:fixed; right:var(--spacing-xl); bottom:100px; z-index:var(--z-overlay); box-shadow:var(--shadow-lg); }
</style>
