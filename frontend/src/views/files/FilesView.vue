<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useFileStore } from '@/stores/file'
import FileUpload from '@/components/files/FileUpload.vue'
import FileDetail from '@/components/files/FileDetail.vue'
import FileStatusTag from '@/components/files/FileStatusTag.vue'
import type { IUploadedFile } from '@/types'

const fileStore = useFileStore()
const uploadVisible = ref(false)
const detailVisible = ref(false)
const detailFile = ref<IUploadedFile | null>(null)

onMounted(() => fileStore.fetchFiles())

function handleUploadDone() { uploadVisible.value = false; fileStore.fetchFiles(1) }
function handleViewDetail(file: IUploadedFile) { detailFile.value = file; detailVisible.value = true }
async function handleDelete(file: IUploadedFile) {
  try {
    await ElMessageBox.confirm(`确定删除「${file.filename}」吗？`, '删除确认', { type: 'warning' })
    await fileStore.remove(file.id)
  } catch { /* cancelled */ }
}
function handleReparse(file: IUploadedFile) { fileStore.reparse(file.id) }

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div><h1 class="page-header__title">文件管理</h1><p class="page-header__subtitle">上传学习资料，AI 自动解析生成总结与习题</p></div>
      <el-button type="primary" @click="uploadVisible = true"><el-icon><Upload /></el-icon> 上传文件</el-button>
    </div>

    <!-- 筛选 -->
    <div style="margin-bottom:var(--spacing-base);display:flex;gap:var(--spacing-sm);align-items:center">
      <span style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">类型筛选：</span>
      <el-select v-model="fileStore.filterFileType" placeholder="全部类型" size="small" style="width:140px" @change="fileStore.fetchFiles(1)">
        <el-option v-for="opt in fileStore.fileTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button size="small" @click="fileStore.fetchFiles()" :loading="fileStore.loading">刷新</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="fileStore.files" v-loading="fileStore.loading" stripe style="width:100%">
      <el-table-column prop="filename" label="文件名" min-width="200">
        <template #default="{ row }: { row: IUploadedFile }">
          <el-button link type="primary" @click="handleViewDetail(row)">{{ row.filename }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="file_type" label="类型" width="80">
        <template #default="{ row }"><el-tag size="small">{{ row.file_type.toUpperCase() }}</el-tag></template>
      </el-table-column>
      <el-table-column label="大小" width="90">
        <template #default="{ row }">{{ fmtSize(row.file_size) }}</template>
      </el-table-column>
      <el-table-column label="解析状态" width="110">
        <template #default="{ row }"><FileStatusTag :status="row.parse_status" /></template>
      </el-table-column>
      <el-table-column label="上传时间" width="140">
        <template #default="{ row }">{{ fmtDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
          <el-button v-if="row.parse_status === 'failed'" link type="warning" size="small" @click="handleReparse(row)">重解析</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div style="display:flex;justify-content:center;margin-top:var(--spacing-base)" v-if="fileStore.totalPages > 1">
      <el-pagination v-model:current-page="fileStore.currentPage" :total="fileStore.total" :page-size="fileStore.pageSize" @current-change="(p: number) => fileStore.fetchFiles(p)" layout="prev, pager, next" />
    </div>

    <!-- 上传对话框 -->
    <FileUpload v-model:visible="uploadVisible" @uploaded="handleUploadDone" />

    <!-- 详情抽屉 -->
    <FileDetail v-model:visible="detailVisible" :file-id="detailFile?.id ?? null" />
  </div>
</template>
