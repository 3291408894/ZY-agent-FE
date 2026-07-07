<script setup lang="ts">
// ================================================================
// ChatHistory — 会话历史侧边栏（仿 DeepSeek 风格）
// 按日期分组（今天/昨天/本周/更早）
// 支持新建对话、切换会话、删除、重命名
// ================================================================

import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { ISessionGroup } from '@/types'

// ── Props ──
defineProps<{
  sessions: ISessionGroup[]
  currentSessionId: string | null
  loading: boolean
}>()

// ── Emits ──
const emit = defineEmits<{
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'rename-session', sessionId: string, title: string): void
  (e: 'new-chat'): void
}>()

// ── 内联编辑状态 ──
const editingId = ref<string | null>(null)
const editingTitle = ref('')

function startEdit(sessionId: string, currentTitle: string) {
  editingId.value = sessionId
  editingTitle.value = currentTitle
}

function confirmEdit(originalId: string) {
  const title = editingTitle.value.trim()
  if (title && editingId.value === originalId) {
    emit('rename-session', originalId, title)
  }
  editingId.value = null
  editingTitle.value = ''
}

function cancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}

// ── 删除确认 ──
async function confirmDelete(sessionId: string, title: string) {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${title}」吗？删除后不可恢复。`,
      '删除会话',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    emit('delete-session', sessionId)
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <aside class="chat-history">
    <!-- ── 新建对话按钮 ── -->
    <div class="chat-history__header">
      <el-button
        type="primary"
        :icon="'Edit'"
        class="chat-history__new-btn"
        @click="emit('new-chat')"
      >
        新建对话
      </el-button>
    </div>

    <!-- ── 加载态 ── -->
    <div v-if="loading" class="chat-history__skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-item">
        <el-skeleton animated :rows="1" :throttle="500" />
      </div>
    </div>

    <!-- ── 空状态 ── -->
    <div
      v-else-if="sessions.length === 0"
      class="chat-history__empty"
    >
      <el-icon :size="32" color="var(--color-text-placeholder)">
        <ChatDotRound />
      </el-icon>
      <p>暂无对话记录</p>
      <span>开始一段新的对话吧</span>
    </div>

    <!-- ── 按日期分组的会话列表 ── -->
    <nav v-else class="chat-history__list">
      <div
        v-for="group in sessions"
        :key="group.label"
        class="session-group"
      >
        <!-- 分组标签 -->
        <div class="session-group__label">{{ group.label }}</div>

        <!-- 分组下的会话列表 -->
        <ul class="session-group__items">
          <li
            v-for="session in group.sessions"
            :key="session.id"
            class="session-item"
            :class="{
              'is-active': session.id === currentSessionId,
              'is-editing': editingId === session.id,
            }"
            @click="emit('select-session', session.id)"
          >
            <!-- 正常显示：标题 + hover 操作按钮 -->
            <div v-if="editingId !== session.id" class="session-item__display">
              <el-icon :size="14" class="session-item__icon">
                <ChatDotRound />
              </el-icon>
              <span class="session-item__title">{{ session.title }}</span>
              <div class="session-item__actions">
                <el-button
                  :icon="'Edit'"
                  :size="'small'"
                  text
                  class="action-btn"
                  title="重命名"
                  @click.stop="startEdit(session.id, session.title)"
                />
                <el-button
                  :icon="'Delete'"
                  :size="'small'"
                  text
                  type="danger"
                  class="action-btn"
                  title="删除"
                  @click.stop="confirmDelete(session.id, session.title)"
                />
              </div>
            </div>

            <!-- 编辑模式 -->
            <div v-else class="session-item__edit" @click.stop>
              <el-input
                v-model="editingTitle"
                size="small"
                maxlength="100"
                @keyup.enter="confirmEdit(session.id)"
                @keyup.escape="cancelEdit"
                @blur="cancelEdit"
                ref="editInputRef"
              />
            </div>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<style lang="scss" scoped>
.chat-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border-light);
  overflow: hidden;

  // ── 头部：新建对话按钮 ──
  &__header {
    padding: var(--spacing-base);
    border-bottom: 1px solid var(--color-border-light);
  }

  &__new-btn {
    width: 100%;
  }

  // ── 加载骨架屏 ──
  &__skeleton {
    padding: var(--spacing-base);
  }

  .skeleton-item {
    padding: var(--spacing-sm) 0;
  }

  // ── 空状态 ──
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--color-text-placeholder);

    p {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
    }

    span {
      font-size: var(--font-size-sm);
    }
  }

  // ── 会话列表 ──
  &__list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm) 0;
  }
}

// ── 分组 ──
.session-group {
  margin-bottom: var(--spacing-xs);

  &__label {
    padding: var(--spacing-sm) var(--spacing-base);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-placeholder);
    text-transform: none;
    letter-spacing: 0;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0 var(--spacing-sm);
  }
}

// ── 会话条目 ──
.session-item {
  position: relative;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-secondary);

    .session-item__actions {
      opacity: 1;
    }
  }

  &.is-active {
    background: var(--color-primary-light);

    .session-item__title {
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__display {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-sm);
    min-height: 36px;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--color-text-placeholder);
  }

  &__title {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: var(--line-height-base);
  }

  // ── 操作按钮（hover 时显示） ──
  &__actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--transition-fast);

    .action-btn {
      width: 26px;
      height: 26px;
      padding: 0;
      color: var(--color-text-secondary);

      &:hover {
        color: var(--color-primary);
        background: var(--color-bg);
      }
    }
  }

  // ── 编辑模式 ──
  &__edit {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}

// ── 激活态 action 按钮始终可见 ──
.session-item.is-active .session-item__actions {
  opacity: 1;
}
</style>
