<script setup lang="ts">
// ================================================================
// ThoughtChainPanel — AI 思考链可视化面板（PBI_12）
// 实时展示 Agent 的任务拆解、推理步骤和工具调用
// 支持收起/展开，历史会话可回看
// ================================================================

import { ref, computed, watch, nextTick } from 'vue'
import type { IThoughtStep, IToolCall } from '@/types'

// ── Props ──
interface Props {
  /** 思考步骤列表 */
  steps: IThoughtStep[]
  /** 工具调用记录 */
  toolCalls: IToolCall[]
  /** 是否正在流式输出（新步骤出现时自动展开） */
  isStreaming?: boolean
  /** 是否为历史会话回看（不显示动画） */
  isHistory?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  isHistory: false,
})

// ── Emits ──
const emit = defineEmits<{
  (e: 'toggle'): void
}>()

// ── 本地状态 ──
const isExpanded = ref(true)
const stepsContainer = ref<HTMLElement | null>(null)

// 流式输出时自动滚动到底部
watch(
  () => props.steps.length,
  async () => {
    if (props.isStreaming) {
      await nextTick()
      if (stepsContainer.value) {
        stepsContainer.value.scrollTop = stepsContainer.value.scrollHeight
      }
    }
  }
)

// 流式停止时自动展开
watch(
  () => props.isStreaming,
  (val) => {
    if (val) {
      isExpanded.value = true
    }
  }
)

// ── 计算属性 ──
const hasContent = computed(
  () => props.steps.length > 0 || props.toolCalls.length > 0
)

const stepCount = computed(() => props.steps.length)

function toggle() {
  isExpanded.value = !isExpanded.value
  emit('toggle')
}

/** 步骤状态图标 */
function stepIcon(step: IThoughtStep): string {
  const title = step.title || ''
  if (title.includes('分析') || title.includes('识别')) return '🔍'
  if (title.includes('工具') || title.includes('调用')) return '🔧'
  if (title.includes('总结') || title.includes('生成')) return '📝'
  if (title.includes('完成') || title.includes('结束')) return '✅'
  return '💡'
}

/** 步骤状态样式 */
function stepStatusClass(index: number): string {
  if (props.isHistory) return 'thought-step--completed'
  if (!props.isStreaming) return 'thought-step--completed'
  if (index === props.steps.length - 1 && props.isStreaming) return 'thought-step--active'
  return 'thought-step--completed'
}
</script>

<template>
  <div class="thought-chain" :class="{ 'is-expanded': isExpanded, 'is-empty': !hasContent }">
    <!-- ── 面板标题栏 ── -->
    <div class="thought-chain__header" @click="toggle">
      <div class="thought-chain__header-left">
        <el-icon :size="18"><Cpu /></el-icon>
        <span class="thought-chain__title">思考过程</span>
        <el-badge
          v-if="stepCount > 0"
          :value="stepCount"
          :type="isStreaming ? 'warning' : 'info'"
          class="thought-chain__badge"
        />
      </div>
      <div class="thought-chain__header-right">
        <span v-if="isStreaming" class="thought-chain__status thought-chain__status--thinking">
          <span class="thinking-dot"></span>
          思考中...
        </span>
        <span v-else-if="hasContent" class="thought-chain__status thought-chain__status--done">
          <el-icon :size="14"><CircleCheck /></el-icon>
          共 {{ stepCount }} 步
        </span>
        <el-icon :size="16" class="thought-chain__toggle-icon">
          <ArrowRight v-if="!isExpanded" />
          <ArrowDown v-else />
        </el-icon>
      </div>
    </div>

    <!-- ── 面板内容 ── -->
    <transition name="collapse">
      <div v-show="isExpanded" class="thought-chain__body">
        <!-- 空状态 -->
        <div v-if="!hasContent" class="thought-chain__empty">
          <div class="thought-chain__empty-icon">🧠</div>
          <p class="thought-chain__empty-text">
            {{ isStreaming ? 'AI 正在分析你的问题...' : '发送消息后，这里将展示 AI 的思考过程' }}
          </p>
        </div>

        <!-- 步骤列表 -->
        <div v-else ref="stepsContainer" class="thought-steps">
          <div
            v-for="(step, idx) in steps"
            :key="step.step"
            class="thought-step"
            :class="[stepStatusClass(idx), { 'no-animation': isHistory }]"
          >
            <!-- 步骤连线 -->
            <div class="thought-step__connector">
              <div class="thought-step__dot"></div>
              <div v-if="idx < steps.length - 1" class="thought-step__line"></div>
            </div>

            <!-- 步骤内容 -->
            <div class="thought-step__body">
              <div class="thought-step__header">
                <span class="thought-step__icon">{{ stepIcon(step) }}</span>
                <span class="thought-step__number">Step {{ step.step }}</span>
                <span class="thought-step__title">{{ step.title }}</span>
              </div>
              <p class="thought-step__content">{{ step.content }}</p>
            </div>
          </div>

          <!-- 工具调用记录 -->
          <div
            v-for="call in toolCalls"
            :key="call.tool_name"
            class="thought-step thought-step--tool"
            :class="{ 'no-animation': isHistory }"
          >
            <div class="thought-step__connector">
              <div class="thought-step__dot thought-step__dot--tool"></div>
            </div>
            <div class="thought-step__body">
              <div class="thought-step__header">
                <span class="thought-step__icon">🔧</span>
                <span class="thought-step__title">调用工具：{{ call.tool_name }}</span>
              </div>
              <div class="tool-call__params">
                <span class="tool-call__label">参数：</span>
                <code class="tool-call__json">{{ JSON.stringify(call.parameters, null, 0) }}</code>
              </div>
              <div v-if="call.result_summary" class="tool-call__result">
                <span class="tool-call__label">结果：</span>
                <span>{{ call.result_summary }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 思考链面板容器
// ================================================================
.thought-chain {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-base);

  &.is-empty {
    opacity: 0.85;
  }

  // ── 标题栏 ──
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-base);
    cursor: pointer;
    user-select: none;
    background: var(--color-bg-card);
    transition: background var(--transition-fast);
    border-bottom: 1px solid transparent;

    .is-expanded & {
      border-bottom-color: var(--color-border-lighter);
    }

    &:hover {
      background: var(--color-bg-card-hover);
    }
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__badge {
    margin-left: 2px;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__status {
    font-size: var(--font-size-xs);
    display: flex;
    align-items: center;
    gap: 4px;

    &--thinking {
      color: var(--color-warning);
    }

    &--done {
      color: var(--color-text-secondary);
    }
  }

  &__toggle-icon {
    color: var(--color-text-placeholder);
    transition: transform var(--transition-fast);
  }

  // ── 内容区 ──
  &__body {
    padding: var(--spacing-base);
    max-height: 360px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 2px;
    }
  }

  // ── 空状态 ──
  &__empty {
    text-align: center;
    padding: var(--spacing-xl) var(--spacing-base);
  }

  &__empty-icon {
    font-size: 32px;
    margin-bottom: var(--spacing-sm);
  }

  &__empty-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    line-height: var(--line-height-base);
  }
}

// ================================================================
// 思考步骤
// ================================================================
.thought-steps {
  display: flex;
  flex-direction: column;
}

.thought-step {
  display: flex;
  gap: var(--spacing-sm);

  // ── 连线 + 圆点 ──
  &__connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20px;
    flex-shrink: 0;
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-border);
    margin-top: 6px;
    transition: all var(--transition-base);

    &--tool {
      background: var(--color-warning);
      width: 8px;
      height: 8px;
    }
  }

  &__line {
    width: 2px;
    flex: 1;
    min-height: 20px;
    background: var(--color-border-lighter);
    margin: 4px 0;
  }

  // ── 内容区 ──
  &__body {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
    transition: all var(--transition-base);
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  &__icon {
    font-size: var(--font-size-sm);
    flex-shrink: 0;
  }

  &__number {
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-placeholder);
    background: var(--color-bg-secondary);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__content {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    line-height: var(--line-height-base);
    margin: 0;
    word-break: break-word;
  }

  // ── 状态样式 ──
  &--active {
    .thought-step__dot {
      background: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
      animation: pulse-dot 1.2s ease-in-out infinite;
    }
    .thought-step__body {
      background: var(--color-primary-lighter);
      border-left: 3px solid var(--color-primary);
    }
  }

  &--completed {
    .thought-step__dot {
      background: var(--color-success);
    }
    .thought-step__line {
      background: var(--color-success);
      opacity: 0.4;
    }
  }

  // ── 工具调用卡片 ──
  &--tool {
    .thought-step__body {
      background: #fffbf0; // 暖色背景区分工具调用
      border: 1px solid #f0e6c0;
    }
  }

  // 历史回看不显示动画
  &.no-animation {
    .thought-step__dot {
      animation: none !important;
    }
    .thought-step__body {
      border-left-color: transparent !important;
    }
  }
}

// ================================================================
// 工具调用详情
// ================================================================
.tool-call {
  &__params {
    margin-top: 4px;
    font-size: 11px;
  }
  &__label {
    color: var(--color-text-placeholder);
  }
  &__json {
    font-family: var(--font-family-code);
    font-size: 11px;
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    word-break: break-all;
  }
  &__result {
    margin-top: 4px;
    font-size: 11px;
    color: var(--color-text-secondary);
  }
}

// ================================================================
// 思考中动画
// ================================================================
.thinking-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
  animation: pulse-dot 1s ease-in-out infinite;
  margin-right: 2px;
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

// ================================================================
// 折叠动画
// ================================================================
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
