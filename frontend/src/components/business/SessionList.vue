<script setup lang="ts">
// ================================================================
// SessionList — AI 助手会话列表侧边栏
// 对应 PBI_04：对话会话管理
// 支持新建、切换、删除会话
// ================================================================

import { ref, onMounted } from 'vue'
import { useAgentStore } from '@/stores/agent'
import { ElMessageBox } from 'element-plus'

const agentStore = useAgentStore()

// ── Emits ──
const emit = defineEmits<{
  (e: 'select', sessionId: string): void
  (e: 'new'): void
}>()

// ── 挂载时加载会话列表 ──
onMounted(() => {
  agentStore.fetchSessions()
})

// ── 事件处理 ──
function handleSelect(sessionId: string) {
  emit('select', sessionId)
}

function handleNew() {
  emit('new')
}

async function handleDelete(sessionId: string, event: Event) {
  event.stopPropagation()
  try {
    await ElMessageBox.confirm('确定删除这个对话吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await agentStore.removeSession(sessionId)
  } catch {
    // 用户取消
  }
}

/** 格式化时间为相对时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** 截断标题 */
function truncateTitle(title: string, maxLen = 20): string {
  if (!title) return '新对话'
  return title.length > maxLen ? title.slice(0, maxLen) + '...' : title
}
</script>

<template>
  <div class="session-list">
    <!-- ── 新建对话按钮 ── -->
    <div class="session-list__new">
      <el-button type="primary" class="session-list__new-btn" @click="handleNew">
        <el-icon :size="16"><Plus /></el-icon>
        <span>新建对话</span>
      </el-button>
    </div>

    <!-- ── 会话列表 ── -->
    <div class="session-list__items">
      <!-- 加载中 -->
      <div v-if="agentStore.isLoadingSessions" class="session-list__loading">
        <el-icon class="is-loading" :size="20"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!agentStore.hasSessions" class="session-list__empty">
        <div class="session-list__empty-icon">💬</div>
        <p class="session-list__empty-text">暂无对话记录</p>
        <p class="session-list__empty-hint">点击上方按钮开始新的对话</p>
      </div>

      <!-- 会话项 -->
      <div
        v-for="session in agentStore.sessions"
        :key="session.id"
        class="session-item"
        :class="{
          'is-active': session.id === agentStore.currentSessionId,
        }"
        @click="handleSelect(session.id)"
      >
        <div class="session-item__icon">
          <el-icon :size="16"><ChatDotRound /></el-icon>
        </div>
        <div class="session-item__info">
          <div class="session-item__title">
            {{ truncateTitle(session.title) }}
          </div>
          <div class="session-item__time">
            {{ formatTime(session.updated_at || session.created_at) }}
          </div>
        </div>
        <el-button
          class="session-item__delete"
          :size="'small'"
          text
          circle
          @click="(e: MouseEvent) => handleDelete(session.id, e)"
        >
          <el-icon :size="14"><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- ── 底部提示 ── -->
    <div class="session-list__footer">
      <span class="session-list__footer-text">
        {{ agentStore.sessions.length }} 个对话
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ================================================================
// 会话列表面板
// ================================================================
.session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border-light);

  // ── 新建按钮 ──
  &__new {
    padding: var(--spacing-base);
    border-bottom: 1px solid var(--color-border-lighter);
  }

  &__new-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  // ── 列表区域 ──
  &__items {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm) 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 2px;
    }
  }

  // ── 加载状态 ──
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    color: var(--color-text-placeholder);
    font-size: var(--font-size-xs);
  }

  // ── 空状态 ──
  &__empty {
    text-align: center;
    padding: var(--spacing-xxl) var(--spacing-base);
  }
  &__empty-icon {
    font-size: 32px;
    margin-bottom: var(--spacing-sm);
  }
  &__empty-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }
  &__empty-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }

  // ── 底部 ──
  &__footer {
    padding: var(--spacing-sm) var(--spacing-base);
    border-top: 1px solid var(--color-border-lighter);
  }
  &__footer-text {
    font-size: 11px;
    color: var(--color-text-placeholder);
  }
}

// ================================================================
// 会话项
// ================================================================
.session-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-base);
  cursor: pointer;
  transition: background var(--transition-fast);
  position: relative;
  border-radius: 0;

  &:hover {
    background: var(--color-bg-secondary);

    .session-item__delete {
      opacity: 1;
    }
  }

  &.is-active {
    background: var(--color-primary-lighter);

    .session-item__title {
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__icon {
    flex-shrink: 0;
    color: var(--color-text-placeholder);
    .is-active & {
      color: var(--color-primary);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__title {
    font-size: var(--font-size-xs);
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: var(--line-height-base);
  }

  &__time {
    font-size: 11px;
    color: var(--color-text-placeholder);
    margin-top: 2px;
  }

  &__delete {
    opacity: 0;
    flex-shrink: 0;
    color: var(--color-text-placeholder);
    transition: opacity var(--transition-fast), color var(--transition-fast);

    &:hover {
      color: var(--color-danger) !important;
    }
  }
}
</style>
