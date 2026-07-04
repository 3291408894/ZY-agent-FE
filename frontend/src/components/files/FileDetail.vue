<script setup lang="ts">
// ================================================================
// FileDetail — 文件详情侧边面板
// 对应 PBI_05：文件详情展示 + 轮询解析状态
// ================================================================

import { ref, watch, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFileStore } from '@/stores/file'
import { getErrorMsg } from '@/api/modules/file'
import type { IUploadedFile } from '@/types'
import FileStatusTag from './FileStatusTag.vue'

// ================================================================
// Props & Emits
// ================================================================
const props = defineProps<{
  visible: boolean
  fileId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'reparsed', file: IUploadedFile): void
}>()

// ================================================================
// Store
// ================================================================
const fileStore = useFileStore()

// ================================================================
// 状态
// ================================================================
const file = ref<IUploadedFile | null>(null)
const loading = ref(false)
const isPolling = ref(false)

// ================================================================
// 方法
// ================================================================

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 格式化日期 */
function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 加载文件详情 */
async function loadFileDetail() {
  if (!props.fileId) return

  loading.value = true
  try {
    const result = await fileStore.refreshFileStatus(props.fileId)
    file.value = result
    // 如果在解析中，开始轮询
    if (result && result.parse_status === 'processing') {
      startAutoPolling()
    }
  } catch (err: any) {
    ElMessage.error(getErrorMsg(err?.code ?? -1))
  } finally {
    loading.value = false
  }
}

/** 轮询回调 */
function onPollUpdate(updatedFile: IUploadedFile) {
  file.value = updatedFile
  if (updatedFile.parse_status !== 'processing') {
    isPolling.value = false
  }
}

/** 自动轮询 */
function startAutoPolling() {
  if (!props.fileId) return
  isPolling.value = true
  fileStore.startPolling(props.fileId, onPollUpdate, 3000)
}

/** 重新解析 */
async function handleReparse() {
  if (!file.value) return

  try {
    await ElMessageBox.confirm(
      '重新解析将重新处理文件内容，确定要继续吗？',
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return // 用户取消
  }

  loading.value = true
  try {
    const result = await fileStore.reparse(file.value.id)
    if (result) {
      file.value = result
      emit('reparsed', result)
      // 开始轮询
      startAutoPolling()
    }
  } finally {
    loading.value = false
  }
}

/** 关闭面板 */
function handleClose() {
  if (file.value?.id) {
    fileStore.stopPolling(file.value.id)
  }
  isPolling.value = false
  emit('update:visible', false)
}

// ================================================================
// 监听 visible / fileId 变化
// ================================================================
watch(
  () => [props.visible, props.fileId] as const,
  ([visible, fileId]) => {
    if (visible && fileId) {
      loadFileDetail()
    } else if (!visible) {
      // 清理轮询
      if (file.value?.id) {
        fileStore.stopPolling(file.value.id)
      }
      isPolling.value = false
    }
  }
)

// 组件卸载时清除轮询
onUnmounted(() => {
  if (file.value?.id) {
    fileStore.stopPolling(file.value.id)
  }
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="文件详情"
    size="520px"
    :close-on-click-modal="true"
    @close="handleClose"
    class="file-detail-drawer"
  >
    <!-- ── 加载中 ── -->
    <div v-if="loading && !file" class="file-detail__loading">
      <el-icon class="file-detail__loading-icon" :size="32"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- ── 详情内容 ── -->
    <template v-else-if="file">
      <div class="file-detail">
        <!-- ── 基本信息区 ── -->
        <div class="file-detail__section">
          <div class="file-detail__section-title">基本信息</div>
          <div class="file-detail__info-grid">
            <div class="file-detail__info-item">
              <span class="file-detail__label">文件名</span>
              <span class="file-detail__value file-detail__filename">{{ file.filename }}</span>
            </div>
            <div class="file-detail__info-item">
              <span class="file-detail__label">文件类型</span>
              <span class="file-detail__value">
                <el-tag size="small" type="info">{{ file.file_type.toUpperCase() }}</el-tag>
              </span>
            </div>
            <div class="file-detail__info-item">
              <span class="file-detail__label">文件大小</span>
              <span class="file-detail__value">{{ formatFileSize(file.file_size) }}</span>
            </div>
            <div class="file-detail__info-item">
              <span class="file-detail__label">解析状态</span>
              <span class="file-detail__value">
                <FileStatusTag :status="file.parse_status" />
                <span
                  v-if="file.parse_status === 'processing'"
                  class="file-detail__polling-hint"
                >
                  自动刷新中...
                </span>
              </span>
            </div>
            <div class="file-detail__info-item">
              <span class="file-detail__label">上传时间</span>
              <span class="file-detail__value">{{ formatDate(file.created_at) }}</span>
            </div>
            <div class="file-detail__info-item">
              <span class="file-detail__label">存储路径</span>
              <span class="file-detail__value file-detail__path" :title="file.storage_path">
                {{ file.storage_path }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── 解析中 ── -->
        <div v-if="file.parse_status === 'processing'" class="file-detail__section file-detail__processing">
          <div class="file-detail__processing-content">
            <el-icon :size="24" class="file-detail__spinner"><Loading /></el-icon>
            <span>文件正在解析中，请稍候...</span>
          </div>
          <span class="file-detail__processing-hint">页面每 3 秒自动刷新状态</span>
        </div>

        <!-- ── 解析失败 ── -->
        <div v-if="file.parse_status === 'failed'" class="file-detail__section file-detail__failed">
          <div class="file-detail__failed-content">
            <el-icon :size="20"><WarningFilled /></el-icon>
            <span>解析失败，请检查文件内容是否完整或格式是否正确</span>
          </div>
          <el-button type="primary" size="small" @click="handleReparse" :loading="loading">
            <el-icon><Refresh /></el-icon>
            重新解析
          </el-button>
        </div>

        <!-- ── 解析完成 → 展示内容 ── -->
        <template v-if="file.parse_status === 'done'">
          <!-- 摘要 -->
          <div v-if="file.summary" class="file-detail__section">
            <div class="file-detail__section-title">AI 摘要</div>
            <div class="file-detail__summary">{{ file.summary }}</div>
          </div>

          <!-- 知识点标签 -->
          <div v-if="file.knowledge_points?.length" class="file-detail__section">
            <div class="file-detail__section-title">
              知识点
              <span class="file-detail__count">{{ file.knowledge_points.length }}</span>
            </div>
            <div class="file-detail__tags">
              <el-tag
                v-for="(point, idx) in file.knowledge_points"
                :key="idx"
                size="default"
                effect="plain"
                class="file-detail__tag"
              >
                {{ point }}
              </el-tag>
            </div>
          </div>

          <!-- 解析正文 -->
          <div v-if="file.parsed_content" class="file-detail__section">
            <div class="file-detail__section-title">解析内容</div>
            <div class="file-detail__content">
              <pre class="file-detail__content-text">{{ file.parsed_content }}</pre>
            </div>
          </div>
        </template>

        <!-- ── 待解析 ── -->
        <div v-if="file.parse_status === 'pending'" class="file-detail__section file-detail__pending">
          <el-icon :size="20"><Clock /></el-icon>
          <span>该文件尚未解析，请等待系统处理或手动触发解析</span>
        </div>
      </div>
    </template>

    <!-- ── 无文件 ── -->
    <div v-else class="file-detail__empty">
      <div class="empty-state">
        <div class="empty-state__icon">📄</div>
        <div class="empty-state__text">请选择一个文件查看详情</div>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.file-detail-drawer {
  :deep(.el-drawer__body) {
    padding: var(--spacing-xl);
  }
}

.file-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);

  // ── 加载 ──
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-base);
    padding: var(--spacing-xxxl);
    color: var(--color-text-secondary);

    &-icon {
      animation: detail-spin 1s linear infinite;
      color: var(--color-primary);
    }
  }

  // ── 分区 ──
  &__section {
    &-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-base);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: var(--font-size-xs);
    color: var(--color-text-inverse);
    background: var(--color-primary);
    border-radius: 10px;
  }

  // ── 信息网格 ──
  &__info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-base);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
  }

  &__info-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);

    .file-detail__label {
      flex-shrink: 0;
      width: 72px;
      font-size: var(--font-size-sm);
      color: var(--color-text-placeholder);
      line-height: 1.8;
    }

    .file-detail__value {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      line-height: 1.8;
      word-break: break-all;
    }
  }

  &__filename {
    font-weight: var(--font-weight-medium);
  }

  &__path {
    font-family: var(--font-family-code);
    font-size: var(--font-size-xs) !important;
    color: var(--color-text-secondary) !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
  }

  &__polling-hint {
    margin-left: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-primary);
  }

  // ── 处理中状态 ──
  &__processing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl);
    background: var(--color-primary-lighter);
    border-radius: var(--radius-md);
    text-align: center;

    &-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
    }

    &-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-placeholder);
    }
  }

  // ── 失败状态 ──
  &__failed {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-base) var(--spacing-lg);
    background: var(--color-danger-light);
    border-radius: var(--radius-md);

    &-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }
  }

  // ── 待解析 ──
  &__pending {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-base) var(--spacing-lg);
    background: var(--color-info-light);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  // ── 摘要 ──
  &__summary {
    font-size: var(--font-size-sm);
    line-height: 1.8;
    color: var(--color-text);
    padding: var(--spacing-base);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-primary);
  }

  // ── 知识点标签 ──
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  &__tag {
    border-radius: var(--radius-round) !important;
    font-size: var(--font-size-xs);
  }

  // ── 解析内容 ──
  &__content {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-base);
    max-height: 400px;
    overflow-y: auto;

    &-text {
      font-family: var(--font-family-code);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-code);
      color: var(--color-text);
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
  }

  // ── 空状态 ──
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }
}

@keyframes detail-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
