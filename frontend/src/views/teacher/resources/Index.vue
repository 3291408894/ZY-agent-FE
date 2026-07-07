<script setup lang="ts">
/**
 * 教师端 — 教学资源库（占位视图，后端API已就绪）
 */
import { ref, onMounted } from 'vue'
import { get, post, del } from '@/api/request'

interface ResourceItem {
  id: string
  title: string
  subject: string
  grade: string
  resource_type: string
  file_type: string
  file_name: string
  file_size: number
  download_count: number
  uploader: { id: string; nickname: string } | null
  created_at: string
}

const resources = ref<ResourceItem[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)

async function fetchResources() {
  loading.value = true
  try {
    const data = await get<{ items: ResourceItem[]; total: number }>('/api/v1/teacher/resources', {
      page: page.value,
      page_size: 20,
    })
    resources.value = data.items
    total.value = data.total
  } catch { /* 后端已部署后即可正常加载 */ } finally {
    loading.value = false
  }
}

onMounted(fetchResources)

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="resources-page">
    <h2>教学资源库</h2>
    <p class="subtitle">课件、试卷、教案等教学资源的管理与分享</p>

    <el-empty v-if="!loading && resources.length === 0" description="资源库功能已就绪，后端API已部署后即可使用">
      <el-button type="primary" @click="fetchResources">刷新</el-button>
    </el-empty>

    <el-table v-else :data="resources" stripe style="width: 100%">
      <el-table-column prop="title" label="资源标题" min-width="200" />
      <el-table-column prop="subject" label="学科" width="80" />
      <el-table-column prop="grade" label="年级" width="100" />
      <el-table-column prop="file_name" label="文件名" min-width="180" />
      <el-table-column label="大小" width="80">
        <template #default="{ row }">{{ formatSize(row.file_size) }}</template>
      </el-table-column>
      <el-table-column prop="download_count" label="下载" width="70" />
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.resources-page { padding: 24px; max-width: 1100px; margin: 0 auto; }
.subtitle { color: var(--el-text-color-secondary); margin-bottom: 20px; }
</style>
