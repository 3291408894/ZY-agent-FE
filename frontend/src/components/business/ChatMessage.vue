<script setup lang="ts">
// ================================================================
// ChatMessage — 单条对话消息气泡
// 支持：用户/助手角色、Markdown 渲染、思考链内嵌、工具调用展示、打字机光标
// ================================================================

import { computed } from 'vue'
import type { IChatMessage } from '@/types'
import MathRenderer from '@/components/common/MathRenderer.vue'

// ── Props ──
interface Props {
  message: IChatMessage
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
})

// ── 角色判断 ──
const isUser = computed(() => props.message.role === 'user')
const isStreamingMsg = computed(() => props.message.id === '__streaming__')
const hasThoughtChain = computed(
  () => props.message.thought_chain && props.message.thought_chain.length > 0
)
const hasToolCalls = computed(
  () => props.message.tool_calls && props.message.tool_calls.length > 0
)

/** 简单 Markdown 渲染：将 **text** 转为 <strong>，- 列表转 <ul>，换行保持不变 */
function renderContent(text: string): string {
  if (!text) return ''
  let html = text
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // 将 ## 标题转为 h3
    .replace(/^## (.+)$/gm, '<h4 class="md-heading">$1</h4>')
    // 将 ### 标题转为 h4
    .replace(/^### (.+)$/gm, '<h5 class="md-heading">$1</h5>')
    // 无序列表项
    .replace(/^- (.+)$/gm, '<li class="md-list-item">$1</li>')
    // 有序列表项
    .replace(/^\d+\.\s(.+)$/gm, '<li class="md-list-item">$1</li>')
    // 换行
    .replace(/\n\n/g, '</p><p class="md-paragraph">')
    .replace(/\n/g, '<br/>')

  html = '<p class="md-paragraph">' + html + '</p>'
  // 包裹连续的 li
  html = html.replace(
    /(<li class="md-list-item">.*?<\/li>)\s*(?=<li class="md-list-item">)/g,
    '$1'
  )
  html = html.replace(
    /((?:<li class="md-list-item">.*?<\/li>\s*)+)/g,
    '<ul class="md-list">$1</ul>'
  )
  return html
}

/** 格式化时间 */
function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div
    class="chat-message"
    :class="{
      'chat-message--user': isUser,
      'chat-message--assistant': !isUser,
      'chat-message--streaming': isStreamingMsg && isStreaming,
    }"
  >
    <!-- ── 头像 ── -->
    <div class="chat-message__avatar">
      <template v-if="isUser">
        <el-avatar :size="36" icon="UserFilled" />
      </template>
      <template v-else>
        <el-avatar :size="36" class="ai-avatar">
          <span class="ai-avatar__text">AI</span>
        </el-avatar>
      </template>
    </div>

    <!-- ── 消息主体 ── -->
    <div class="chat-message__body">
      <!-- 发送者名称 -->
      <div class="chat-message__meta">
        <span class="chat-message__sender">
          {{ isUser ? '我' : 'AI 助手' }}
        </span>
        <span
          v-if="!isStreamingMsg"
          class="chat-message__time"
        >
          {{ formatMessageTime(message.created_at) }}
        </span>
        <span v-if="isStreamingMsg && isStreaming" class="chat-message__typing-indicator">
          正在输出...
        </span>
      </div>

      <!-- 思考链（内嵌在消息中，仅 assistant 且非流式时显示） -->
      <div
        v-if="hasThoughtChain && !isStreamingMsg"
        class="chat-message__thoughts"
      >
        <el-collapse>
          <el-collapse-item>
            <template #title>
              <div class="thoughts-title">
                <el-icon :size="14"><Cpu /></el-icon>
                <span>思考过程（{{ message.thought_chain!.length }} 步）</span>
              </div>
            </template>
            <div class="thoughts-list">
              <div
                v-for="step in message.thought_chain"
                :key="step.step"
                class="thoughts-item"
              >
                <span class="thoughts-item__step">Step {{ step.step }}</span>
                <span class="thoughts-item__title">{{ step.title }}</span>
                <p class="thoughts-item__content">{{ step.content }}</p>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 工具调用记录（内嵌在消息中） -->
      <div v-if="hasToolCalls && !isStreamingMsg" class="chat-message__tools">
        <div
          v-for="call in message.tool_calls"
          :key="call.tool_name"
          class="tool-badge"
        >
          <el-icon :size="12"><Switch /></el-icon>
          <span>已调用「{{ call.tool_name }}」工具</span>
          <span v-if="call.result_summary" class="tool-badge__result">
            — {{ call.result_summary }}
          </span>
        </div>
      </div>

      <!-- 消息文本内容 -->
      <div
        class="chat-message__content"
        :class="{ 'chat-message__content--markdown': !isUser }"
      >
        <template v-if="isUser">
          {{ message.content }}
        </template>
        <template v-else>
          <MathRenderer :text="message.content" />
          <!-- 流式输出时的光标动画 -->
          <span
            v-if="isStreamingMsg && isStreaming"
            class="typing-cursor"
          >|</span>
        </template>
      </div>

      <!-- 流式输出时的思考链实时预览（如果当前正在流式输出且有思考步骤） -->
      <div
        v-if="isStreamingMsg && hasThoughtChain && isStreaming"
        class="chat-message__live-thoughts"
      >
        <div
          v-for="step in message.thought_chain"
          :key="step.step"
          class="live-thought-badge"
        >
          <span class="live-thought-badge__dot"></span>
          <span>{{ step.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 消息气泡
// ================================================================
.chat-message {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-base) 0;
  animation: message-enter 0.3s ease;

  // ── 用户消息（右对齐） ──
  &--user {
    flex-direction: row-reverse;

    .chat-message__body {
      align-items: flex-end;
    }

    .chat-message__content {
      background: var(--color-primary);
      color: var(--color-text-inverse);
      border-radius: var(--radius-lg) var(--radius-lg) 4px var(--radius-lg);
    }

    .chat-message__meta {
      flex-direction: row-reverse;
    }
  }

  // ── 助手消息（左对齐） ──
  &--assistant {
    .chat-message__content {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px;
      color: var(--color-text);
    }
  }
}

// ── 头像 ──
.chat-message__avatar {
  flex-shrink: 0;
  padding-top: 4px;
}

.ai-avatar {
  background: linear-gradient(135deg, #5b9bd5, #7eb8e0);
  &__text {
    font-size: 14px;
    font-weight: var(--font-weight-bold);
    color: #fff;
  }
}

// ── 主体 ──
.chat-message__body {
  display: flex;
  flex-direction: column;
  max-width: 75%;
  min-width: 0;
}

// ── 元信息 ──
.chat-message__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

.chat-message__sender {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.chat-message__time {
  font-size: 11px;
  color: var(--color-text-placeholder);
}

.chat-message__typing-indicator {
  font-size: 11px;
  color: var(--color-primary);
  animation: blink-text 1.2s ease-in-out infinite;
}

// ── 内容 ──
.chat-message__content {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  word-break: break-word;

  &--markdown {
    // Markdown 渲染样式
    :deep(.md-heading) {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      margin: var(--spacing-sm) 0;
      color: var(--color-text-primary);

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(.md-paragraph) {
      margin: 0;
      &:empty {
        display: none;
      }
    }

    :deep(.md-list) {
      margin: var(--spacing-xs) 0;
      padding-left: var(--spacing-lg);
    }

    :deep(.md-list-item) {
      margin-bottom: 2px;
      line-height: var(--line-height-base);
    }

    // MathRenderer 文本段落
    :deep(.math-renderer) {
      font-size: var(--font-size-sm);
      line-height: var(--line-height-base);
    }

    // 覆盖 MathRenderer 的 inline/block 公式间距
    :deep(.math-renderer__inline) {
      padding: 0 2px;
    }

    :deep(.math-renderer__block) {
      margin: 8px 0;
    }

    :deep(.inline-code) {
      font-family: var(--font-family-code);
      font-size: 0.9em;
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
    }

    :deep(strong) {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }
}

// ── 思考链内嵌 ──
.chat-message__thoughts {
  margin-bottom: var(--spacing-sm);

  :deep(.el-collapse) {
    border: none;
    background: transparent;
  }
  :deep(.el-collapse-item__header) {
    height: auto;
    line-height: inherit;
    border: none;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-base);
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
  :deep(.el-collapse-item__wrap) {
    border: none;
    background: transparent;
  }
  :deep(.el-collapse-item__content) {
    padding: var(--spacing-sm) 0 0;
  }
}

.thoughts-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.thoughts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.thoughts-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);

  &__step {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    margin-right: var(--spacing-xs);
  }
  &__title {
    color: var(--color-text-primary);
  }
  &__content {
    margin: 2px 0 0;
    color: var(--color-text-secondary);
    line-height: var(--line-height-base);
  }
}

// ── 工具调用 ──
.chat-message__tools {
  margin-bottom: var(--spacing-sm);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tool-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-warning);
  background: var(--color-warning-light);
  padding: 2px 10px;
  border-radius: var(--radius-round);

  &__result {
    color: var(--color-text-secondary);
  }
}

// ── 流式实时思考徽章 ──
.chat-message__live-thoughts {
  margin-top: var(--spacing-sm);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.live-thought-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-lighter);
  padding: 2px 10px;
  border-radius: var(--radius-round);

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    animation: pulse-dot 1.2s ease-in-out infinite;
  }
}

// ================================================================
// 动画
// ================================================================
.typing-cursor {
  display: inline-block;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  animation: blink-cursor 0.7s step-end infinite;
  margin-left: 1px;
}

@keyframes blink-cursor {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes blink-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.5;
  }
}

@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
