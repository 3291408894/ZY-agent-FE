<script setup lang="ts">
// ================================================================
// InviteCodePanel — 邀请码展示面板
// 大字体显示邀请码，支持一键复制和重新生成
// ================================================================

import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  inviteCode: string
  classId: string
  archived: boolean
}>()

const emit = defineEmits<{
  regenerate: [classId: string]
}>()

const regenerating = ref(false)

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.inviteCode)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch {
    // 降级方案：使用 execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = props.inviteCode
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      ElMessage.success('邀请码已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动复制')
    }
  }
}

async function handleRegenerate() {
  try {
    await ElMessageBox.confirm(
      '重新生成后旧邀请码将立即失效，确定继续？',
      '确认重新生成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  regenerating.value = true
  try {
    emit('regenerate', props.classId)
  } finally {
    regenerating.value = false
  }
}
</script>

<template>
  <div class="invite-code-panel">
    <div class="invite-code-panel__header">
      <span class="invite-code-panel__label">班级邀请码</span>
      <span class="invite-code-panel__hint">将此码分享给学生即可加入班级</span>
    </div>

    <div class="invite-code-panel__code-wrapper">
      <code class="invite-code-panel__code">{{ inviteCode }}</code>
      <div class="invite-code-panel__actions">
        <el-button
          type="primary"
          size="default"
          :icon="'CopyDocument'"
          @click="handleCopy"
        >
          复制邀请码
        </el-button>
        <el-button
          v-if="!archived"
          type="warning"
          size="default"
          plain
          :loading="regenerating"
          @click="handleRegenerate"
        >
          重新生成
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.invite-code-panel {
  background: var(--color-primary-lighter);
  border: 1px solid var(--color-primary-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-lg);
  }

  &__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__code-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-xl);
    flex-wrap: wrap;
  }

  &__code {
    font-family: var(--font-family-code);
    font-size: 36px;
    font-weight: var(--font-weight-bold);
    letter-spacing: 6px;
    color: var(--color-primary-dark);
    background: var(--color-bg-card);
    padding: var(--spacing-sm) var(--spacing-xl);
    border-radius: var(--radius-md);
    border: 2px dashed var(--color-primary);
    user-select: all;
    cursor: copy;
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  @media (max-width: 768px) {
    &__code-wrapper {
      flex-direction: column;
      align-items: flex-start;
    }

    &__code {
      font-size: 28px;
      letter-spacing: 4px;
    }
  }
}
</style>
