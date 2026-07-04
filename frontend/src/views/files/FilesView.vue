<script setup lang="ts">
// ================================================================
// FilesView — 文件管理页面
// 对应 PBI_05：多格式文件上传解析
// ================================================================

import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useFileStore } from '@/stores/file'
import type { IUploadedFile, FileType } from '@/types'
import FileStatusTag from '@/components/files/FileStatusTag.vue'
import FileUpload from '@/components/files/FileUpload.vue'
import FileDetail from '@/components/files/FileDetail.vue'

// ================================================================
// Store
// ================================================================
const fileStore = useFileStore()

// ================================================================
// 对话框状态
// ================================================================
const uploadDialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const detailFileId = ref<string | null>(null)

// ================================================================
// 生命周期
// ================================================================
onMounted(() => {
  fileStore.fetchFiles()
})

// ================================================================
// 文件大小格式化
// ================================================================
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

// ================================================================
// 操作
// ================================================================

/** 打开上传对话框 */
function openUploadDialog() {
  uploadDialogVisible.value = true
}

/** 上传完成回调 */
function onUploaded(_file: IUploadedFile) {
  // store 已刷新列表，无需额外处理
}

/** 打开详情面板 */
function openDetail(fileId: string) {
  detailFileId.value = fileId
  detailDrawerVisible.value = true
}

/** 删除文件（需二次确认） */
async function handleDelete(file: IUploadedFile) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件「${file.filename}」吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    await fileStore.remove(file.id)
  } catch {
    // 用户取消或删除失败
  }
}

/** 重新解析文件 */
async function handleReparse(file: IUploadedFile) {
  await fileStore.reparse(file.id)
}

/** 文件类型筛选 */
function handleFilterChange(fileType: FileType | '') {
  fileStore.filterByType(fileType)
}

/** 翻页 */
function handlePageChange(page: number) {
  fileStore.goToPage(page)
}

/** 上传完成后回调 */
function onDetailReparsed(_file: IUploadedFile) {
  // store 已更新
}
</script>

<template>
  <div class="files-page">
    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 页面头部 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">文件管理</h1>
        <p class="page-header__subtitle">
          上传学习资料，AI 自动解析并生成总结/习题
          <span class="files-page__total">（共 {{ fileStore.total }} 个文件）</span>
        </p>
      </div>
      <el-button type="primary" :icon="Upload" @click="openUploadDialog">
        上传文件
      </el-button>
    </div>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 筛选工具栏 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="files-page__toolbar">
      <div class="files-page__filter">
        <span class="files-page__filter-label">文件类型：</span>
        <el-select
          :model-value="fileStore.filterFileType"
          @update:model-value="handleFilterChange"
          placeholder="全部类型"
          size="default"
          style="width: 160px"
          clearable
        >
          <el-option
            v-for="opt in fileStore.fileTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>
      <el-button
        :icon="Refresh"
        @click="fileStore.fetchFiles()"
        :loading="fileStore.loading"
      >
        刷新
      </el-button>
    </div>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 文件表格 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div class="card files-page__table-wrapper">
      <el-table
        :data="fileStore.files"
        v-loading="fileStore.loading"
        stripe
        style="width: 100%"
        :header-cell-style="{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          fontWeight: '600',
        }"
        row-class-name="files-page__row"
        empty-text=" "
        highlight-current-row
      >
        <!-- 文件名 -->
        <el-table-column prop="filename" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="files-page__file-cell">
              <el-icon :size="20" class="files-page__file-icon"><Document /></el-icon>
              <span class="files-page__file-name" :title="row.filename">{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 文件类型 -->
        <el-table-column prop="file_type" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">
              {{ (row.file_type as string).toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 文件大小 -->
        <el-table-column label="大小" width="110" align="right">
          <template #default="{ row }">
            <span class="files-page__size">{{ formatFileSize(row.file_size) }}</span>
          </template>
        </el-table-column>

        <!-- 解析状态 -->
        <el-table-column label="解析状态" width="120" align="center">
          <template #default="{ row }">
            <FileStatusTag :status="row.parse_status" size="small" />
          </template>
        </el-table-column>

        <!-- 上传时间 -->
        <el-table-column label="上传时间" width="170" align="center">
          <template #default="{ row }">
            <span class="files-page__date">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="files-page__actions">
              <el-button
                type="primary"
                link
                size="small"
                @click="openDetail(row.id)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.parse_status === 'failed'"
                type="warning"
                link
                size="small"
                @click="handleReparse(row)"
              >
                重新解析
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- ── 空状态 ── -->
      <div v-if="!fileStore.loading && fileStore.files.length === 0" class="empty-state">
        <div class="empty-state__icon">📂</div>
        <div class="empty-state__text">
          {{ fileStore.filterFileType ? `暂无 "${fileStore.filterFileType.toUpperCase()}" 类型的文件` : '暂无上传的文件' }}
        </div>
        <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          点击"上传文件"按钮开始上传学习资料
        </p>
        <el-button
          v-if="!fileStore.filterFileType"
          type="primary"
          style="margin-top: var(--spacing-lg);"
          @click="openUploadDialog"
        >
          上传第一个文件
        </el-button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 分页器 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <div v-if="fileStore.totalPages > 1" class="files-page__pagination">
      <el-pagination
        :current-page="fileStore.currentPage"
        :page-size="fileStore.pageSize"
        :total="fileStore.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="(size: number) => { fileStore.pageSize = size; fileStore.fetchFiles(1) }"
      />
    </div>

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 上传对话框 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <FileUpload
      v-model:visible="uploadDialogVisible"
      @uploaded="onUploaded"
    />

    <!-- ════════════════════════════════════════════════════════════ -->
    <!-- 详情抽屉 -->
    <!-- ════════════════════════════════════════════════════════════ -->
    <FileDetail
      v-model:visible="detailDrawerVisible"
      :file-id="detailFileId"
      @reparsed="onDetailReparsed"
    />
  </div>
</template>

<style lang="scss" scoped>
.files-page {
  // ── 总数 ──
  &__total {
    color: var(--color-text-placeholder);
    font-weight: var(--font-weight-normal);
  }

  // ── 工具栏 ──
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);
    gap: var(--spacing-base);
  }

  &__filter {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    &-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
  }

  // ── 表格 ──
  &__table-wrapper {
    padding: 0;
    overflow: hidden;

    :deep(.el-table) {
      --el-table-border-color: var(--color-border-lighter);

      // 表格行 hover
      .el-table__body tr:hover > td {
        background-color: var(--color-bg-card-hover) !important;
      }
    }
  }

  &__row {
    cursor: pointer;
  }

  // ── 文件单元格 ──
  &__file-cell {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__file-icon {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  &__file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }

  // ── 大小 ──
  &__size {
    font-family: var(--font-family-code);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  // ── 日期 ──
  &__date {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  // ── 操作 ──
  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
  }

  // ── 分页 ──
  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-xl);
    padding: var(--spacing-base) 0;
  }
}

// ── 响应式 ──
@media (max-width: 768px) {
  .files-page {
    &__toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    &__filter {
      flex-direction: column;
      align-items: stretch;

      .el-select {
        width: 100% !important;
      }
    }

    &__pagination {
      :deep(.el-pagination) {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  }
}
</style>
