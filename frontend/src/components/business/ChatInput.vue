<script setup lang="ts">
// ================================================================
// ChatInput — AI 助手对话输入区域
// 支持：文本输入、回车发送、Shift+回车换行、停止生成按钮、快捷提示
// ================================================================

import { ref, computed, nextTick } from 'vue'

// ── Props ──
interface Props {
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  disabled: false,
  placeholder: '输入你的问题，AI 助手会为你解答...',
})

// ── Emits ──
const emit = defineEmits<{
  (e: 'send', message: string): void
  (e: 'stop'): void
}>()

// ── 本地状态 ──
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(
  () => inputText.value.trim().length > 0 && !props.isStreaming && !props.disabled
)

// ── 快捷提示词 ──
const quickPrompts = [
  '帮我总结一篇课文',
  '给我出 5 道数学题',
  '解释一下光合作用',
  '帮我分析这篇文言文',
]

// ── 方法 ──
function handleSend() {
  if (!canSend.value) return
  const text = inputText.value.trim()
  inputText.value = ''
  emit('send', text)
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

function handleKeydown(e: KeyboardEvent) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleStop() {
  emit('stop')
}

function handleQuickPrompt(prompt: string) {
  inputText.value = prompt
  nextTick(() => {
    textareaRef.value?.focus()
  })
}
</script>

<template>
  <div class="chat-input">
    <!-- ── 快捷提示 ── -->
    <div class="chat-input__quick-prompts">
      <span class="quick-prompts__label">试试：</span>
      <el-button
        v-for="prompt in quickPrompts"
        :key="prompt"
        :size="'small'"
        text
        class="quick-prompts__btn"
        @click="handleQuickPrompt(prompt)"
      >
        {{ prompt }}
      </el-button>
    </div>

    <!-- ── 输入区域 ── -->
    <div class="chat-input__row">
      <el-input
        ref="textareaRef"
        v-model="inputText"
        type="textarea"
        :rows="2"
        :placeholder="placeholder"
        :disabled="disabled"
        resize="none"
        class="chat-input__textarea"
        @keydown="handleKeydown"
      />

      <div class="chat-input__actions">
        <!-- 停止按钮（流式输出中） -->
        <el-button
          v-if="isStreaming"
          type="danger"
          :size="'default'"
          class="chat-input__stop-btn"
          @click="handleStop"
        >
          <el-icon :size="16"><VideoPause /></el-icon>
          <span>停止生成</span>
        </el-button>

        <!-- 发送按钮 -->
        <el-button
          v-else
          type="primary"
          :size="'default'"
          :disabled="!canSend"
          class="chat-input__send-btn"
          @click="handleSend"
        >
          <el-icon :size="16"><Promotion /></el-icon>
          <span>发送</span>
        </el-button>
      </div>
    </div>

    <!-- ── 提示文字 ── -->
    <div class="chat-input__hint">
      <span>Enter 发送，Shift + Enter 换行</span>
      <span class="chat-input__hint-divider">|</span>
      <span>AI 生成内容仅供参考，请以教材为准</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 输入区域
// ================================================================
.chat-input {
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border-light);
  padding: var(--spacing-base);

  // ── 快捷提示 ──
  &__quick-prompts {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .quick-prompts {
    &__label {
      font-size: var(--font-size-xs);
      color: var(--color-text-placeholder);
      flex-shrink: 0;
    }
    &__btn {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      padding: 2px 8px;
      height: auto;

      &:hover {
        color: var(--color-primary);
        background: var(--color-primary-lighter);
      }
    }
  }

  // ── 输入行 ──
  &__row {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-sm);
  }

  &__textarea {
    flex: 1;

    :deep(.el-textarea__inner) {
      font-size: var(--font-size-sm);
      line-height: var(--line-height-base);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }
    }
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
  }

  &__send-btn,
  &__stop-btn {
    height: 40px;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }

  &__stop-btn {
    animation: stop-pulse 2s ease-in-out infinite;
  }

  // ── 提示文字 ──
  &__hint {
    margin-top: var(--spacing-sm);
    font-size: 11px;
    color: var(--color-text-placeholder);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__hint-divider {
    color: var(--color-border);
  }
}

@keyframes stop-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>
