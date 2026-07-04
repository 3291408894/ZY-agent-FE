<script setup lang="ts">
// ================================================================
// FileUpload — 文件上传对话框/抽屉组件
// 对应 PBI_05：多格式文件上传解析
// ================================================================

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useFileStore } from '@/stores/file'
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  getErrorMsg,
} from '@/api/modules/file'
import type { IUploadedFile } from '@/types'

// ================================================================
// Props & Emits
// ================================================================
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'uploaded', file: IUploadedFile): void
}>()

// ================================================================
// Store
// ================================================================
const fileStore = useFileStore()

// ================================================================
// 状态
// ================================================================
const dragging = ref(false)
const selectedFile = ref<File | null>(null)
const autoParse = ref(true)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 表单校验错误
const validationError = ref('')

// ================================================================
// 计算属性
// ================================================================

/** 当前选中文件的后缀名 */
const fileExtension = computed(() => {
  if (!selectedFile.value) return ''
  const name = selectedFile.value.name
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
})

/** 文件格式是否合法 */
const isFormatValid = computed(() => {
  if (!selectedFile.value) return true
  return ALLOWED_FILE_TYPES.includes(fileExtension.value as any)
})

/** 文件大小是否合法 */
const isSizeValid = computed(() => {
  if (!selectedFile.value) return true
  return selectedFile.value.size <= MAX_FILE_SIZE
})

/** 是否可以上传 */
const canUpload = computed(() => {
  return (
    selectedFile.value !== null &&
    isFormatValid.value &&
    isSizeValid.value &&
    !fileStore.uploading
  )
})

/** 文件大小可读文本 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 允许的文件类型描述 */
const allowedTypesDesc = ALLOWED_FILE_TYPES.map(t => t.toUpperCase()).join(' / ')
const allowedExtDesc = ALLOWED_EXTENSIONS

// ================================================================
// 事件处理
// ================================================================

/** 关闭对话框 */
function handleClose() {
  resetState()
  emit('update:visible', false)
}

/** 重置内部状态 */
function resetState() {
  selectedFile.value = null
  validationError.value = ''
  dragging.value = false
}

/** 拖拽进入 */
function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  dragging.value = true
}

/** 拖拽离开 */
function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
}

/** 拖拽悬停 */
function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

/** 拖拽放下 */
function handleDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) validateAndSetFile(file)
}

/** 点击选择文件 */
function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) validateAndSetFile(file)
  // 重置 input，允许重复选择同一文件
  input.value = ''
}

/** 校验并设置文件 */
function validateAndSetFile(file: File) {
  validationError.value = ''

  // 检查格式
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_FILE_TYPES.includes(ext as any)) {
    validationError.value = `不支持的文件格式 ".${ext}"，仅支持：${allowedTypesDesc}`
    selectedFile.value = null
    return
  }

  // 检查大小
  if (file.size > MAX_FILE_SIZE) {
    validationError.value = `文件大小 ${formatFileSize(file.size)} 超过限制（最大 50MB）`
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

/** 执行上传 */
async function handleUpload() {
  if (!canUpload.value || !selectedFile.value) return

  const result = await fileStore.upload(selectedFile.value, autoParse.value)
  if (result) {
    emit('uploaded', result)
    ElMessage.success(`"${result.filename}" 上传成功！`)
    handleClose()
  }
}

/** 移除已选文件 */
function handleRemoveFile() {
  selectedFile.value = null
  validationError.value = ''
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="上传文件"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="file-upload-dialog"
  >
    <div class="file-upload">
      <!-- ── 拖拽上传区域 ── -->
      <div
        class="file-upload__dropzone"
        :class="{
          'file-upload__dropzone--dragging': dragging,
          'file-upload__dropzone--has-file': selectedFile,
          'file-upload__dropzone--error': validationError,
        }"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @dragover="handleDragOver"
        @drop="handleDrop"
        @click="() => { if (!selectedFile) fileInputRef?.click() }"
      >
        <!-- 无文件：拖拽提示 -->
        <template v-if="!selectedFile">
          <div class="file-upload__dropzone-icon">
            <el-icon :size="48"><UploadFilled /></el-icon>
          </div>
          <div class="file-upload__dropzone-text">
            将文件拖拽到此处，或 <span class="file-upload__link">点击选择文件</span>
          </div>
          <div class="file-upload__dropzone-hint">
            支持 {{ allowedTypesDesc }} 格式，单文件最大 50MB
          </div>
        </template>

        <!-- 已选文件：文件信息 -->
        <template v-else>
          <div class="file-upload__file-info">
            <div class="file-upload__file-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="file-upload__file-details">
              <div class="file-upload__file-name" :title="selectedFile.name">
                {{ selectedFile.name }}
              </div>
              <div class="file-upload__file-meta">
                <span class="file-upload__file-type">{{ fileExtension.toUpperCase() }}</span>
                <span class="file-upload__file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
            </div>
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click.stop="handleRemoveFile"
              :disabled="fileStore.uploading"
            />
          </div>
        </template>
      </div>

      <!-- ── 校验错误 ── -->
      <div v-if="validationError" class="file-upload__error">
        <el-icon><WarningFilled /></el-icon>
        {{ validationError }}
      </div>

      <!-- 隐藏的文件选择 input -->
      <input
        ref="fileInputRef"
        type="file"
        :accept="allowedExtDesc"
        class="file-upload__hidden-input"
        @change="handleFileSelect"
      />

      <!-- ── 上传进度条 ── -->
      <div v-if="fileStore.uploading" class="file-upload__progress">
        <div class="file-upload__progress-header">
          <span>正在上传...</span>
          <span>{{ fileStore.uploadProgress }}%</span>
        </div>
        <el-progress
          :percentage="fileStore.uploadProgress"
          :stroke-width="8"
          :show-text="false"
          :color="'var(--color-primary)'"
        />
      </div>

      <!-- ── 选项：上传后自动解析 ── -->
      <div class="file-upload__options">
        <div class="file-upload__toggle">
          <el-switch v-model="autoParse" :disabled="fileStore.uploading" />
          <span class="file-upload__toggle-label">上传后自动解析</span>
        </div>
        <span class="file-upload__toggle-hint">开启后 AI 将自动解析文件内容</span>
      </div>
    </div>

    <!-- ── 底部按钮 ── -->
    <template #footer>
      <el-button @click="handleClose" :disabled="fileStore.uploading">取消</el-button>
      <el-button
        type="primary"
        @click="handleUpload"
        :disabled="!canUpload"
        :loading="fileStore.uploading"
      >
        {{ fileStore.uploading ? '上传中...' : '开始上传' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.file-upload-dialog {
  :deep(.el-dialog__body) {
    padding-top: var(--spacing-base);
  }
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);

  // ── 拖拽区域 ──
  &__dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xxxl) var(--spacing-xl);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-secondary);
    cursor: pointer;
    transition: all var(--transition-base);
    min-height: 200px;
    user-select: none;

    &:hover {
      border-color: var(--color-primary);
      background: var(--color-primary-lighter);
    }

    &--dragging {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
      box-shadow: 0 0 0 4px var(--color-primary-lighter);
    }

    &--has-file {
      cursor: default;
      border-style: solid;
      border-color: var(--color-border);
      background: var(--color-bg-card);
      padding: var(--spacing-xl);
    }

    &--error {
      border-color: var(--color-danger);
      background: var(--color-danger-light);
    }

    &-icon {
      color: var(--color-text-placeholder);
      margin-bottom: var(--spacing-base);
    }

    &-text {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    &-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-placeholder);
    }
  }

  &__link {
    color: var(--color-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  // ── 已选文件信息 ──
  &__file-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    width: 100%;
  }

  &__file-icon {
    flex-shrink: 0;
    color: var(--color-primary);
    background: var(--color-primary-lighter);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
  }

  &__file-details {
    flex: 1;
    min-width: 0;
  }

  &__file-name {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  &__file-meta {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  &__file-type {
    background: var(--color-bg-secondary);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-code);
  }

  // ── 校验错误 ──
  &__error {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-base);
    background: var(--color-danger-light);
    color: var(--color-danger);
    border-radius: var(--radius-base);
    font-size: var(--font-size-sm);
  }

  // ── 进度条 ──
  &__progress {
    &-header {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
    }
  }

  // ── 选项 ──
  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-base);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    &-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text);
    }

    &-hint {
      font-size: var(--font-size-xs);
      color: var(--color-text-placeholder);
    }
  }

  &__hidden-input {
    display: none;
  }
}
</style>
