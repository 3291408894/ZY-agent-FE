<script setup lang="ts">
// ================================================================
// AgentView — AI 助手对话页面（骨架）
// 对应 PBI_04：AI Agent 自然语言交互
// 对应 PBI_12：AI 思考过程可视化
// ================================================================
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputMessage = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const isStreaming = ref(false)

function sendMessage() {
  if (!inputMessage.value.trim()) return
  messages.value.push({ role: 'user', content: inputMessage.value })
  inputMessage.value = ''
  // TODO: SSE 流式调用
  ElMessage.info('AI 助手功能开发中，敬请期待 Sprint 1 交付')
}
</script>

<template>
  <div class="agent-page">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">AI 助手</h1>
        <p class="page-header__subtitle">与 AI 对话，智能完成学习任务</p>
      </div>
    </div>

    <div class="agent-chat card">
      <!-- 对话区 -->
      <div class="chat-messages">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-state__icon">💬</div>
          <div class="empty-state__text">开始和 AI 助手对话吧</div>
          <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
            试试说："帮我总结《桃花源记》" 或 "给我出 5 道数学题"
          </p>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="chat-message"
          :class="`chat-message--${msg.role}`"
        >
          <div class="chat-message__content">{{ msg.content }}</div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题，AI 助手会为你解答..."
          resize="none"
          @keyup.enter.exact="sendMessage"
        />
        <el-button
          type="primary"
          :disabled="!inputMessage.trim() || isStreaming"
          class="chat-input__send"
          @click="sendMessage"
        >
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.agent-page { max-width: 800px; }
.agent-chat { display: flex; flex-direction: column; height: calc(100vh - var(--header-height) - var(--footer-height) - 200px); min-height: 400px; }
.chat-messages { flex: 1; overflow-y: auto; padding: var(--spacing-base); }
.chat-message { margin-bottom: var(--spacing-base);
  &--user .chat-message__content { background: var(--color-primary-light); color: var(--color-text-primary); margin-left: auto; text-align: right; }
  &--assistant .chat-message__content { background: var(--color-bg-secondary); }
  &__content { display: inline-block; max-width: 80%; padding: var(--spacing-md) var(--spacing-lg); border-radius: var(--radius-lg); font-size: var(--font-size-base); line-height: var(--line-height-base); }
}
.chat-input { display: flex; gap: var(--spacing-sm); padding: var(--spacing-base); border-top: 1px solid var(--color-border-light); background: var(--color-bg-card);
  &__send { flex-shrink: 0; align-self: flex-end; }
}
</style>
