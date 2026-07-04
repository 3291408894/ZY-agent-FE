<script setup lang="ts">
// ================================================================
// FileStatusTag — 文件解析状态标签（可复用）
// 对应 PBI_05
// ================================================================

import type { ParseStatus } from '@/types'

const props = defineProps<{
  status: ParseStatus
  /** 是否显示小尺寸版本 */
  size?: 'default' | 'small'
}>()

// 状态 → Element Plus Tag type 映射
const tagTypeMap: Record<ParseStatus, '' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'info',
  processing: 'warning',
  done: 'success',
  failed: 'danger',
}

// 状态 → 中文标签
const labelMap: Record<ParseStatus, string> = {
  pending: '待解析',
  processing: '解析中',
  done: '已完成',
  failed: '解析失败',
}

// 是否为处理中（需要旋转动画）
const isProcessing = props.status === 'processing'
</script>

<template>
  <el-tag
    :type="tagTypeMap[status]"
    :size="size === 'small' ? 'small' : 'default'"
    :class="['file-status-tag', `file-status-tag--${status}`]"
    effect="plain"
  >
    <el-icon v-if="isProcessing" class="file-status-tag__spinner">
      <Loading />
    </el-icon>
    {{ labelMap[status] }}
  </el-tag>
</template>

<style lang="scss" scoped>
.file-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: var(--font-weight-medium);
  white-space: nowrap;

  &__spinner {
    animation: status-spin 1s linear infinite;
  }

  // 已完成 — 绿色
  &--done {
    --el-tag-text-color: var(--color-success);
    --el-tag-border-color: var(--color-success-light);
    --el-tag-bg-color: var(--color-success-light);
  }

  // 解析中 — 蓝色（覆盖 Element Plus warning 默认橙色）
  &--processing {
    --el-tag-text-color: var(--color-primary);
    --el-tag-border-color: var(--color-primary-light);
    --el-tag-bg-color: var(--color-primary-lighter);
  }

  // 待解析 — 灰色
  &--pending {
    --el-tag-text-color: var(--color-text-secondary);
    --el-tag-border-color: var(--color-border);
    --el-tag-bg-color: var(--color-bg-secondary);
  }

  // 失败 — 红色
  &--failed {
    --el-tag-text-color: var(--color-danger);
    --el-tag-border-color: var(--color-danger-light);
    --el-tag-bg-color: var(--color-danger-light);
  }
}

@keyframes status-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
