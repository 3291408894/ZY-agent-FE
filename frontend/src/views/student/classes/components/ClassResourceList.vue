<script setup lang="ts">
// ================================================================
// 学生端 — 班级资源列表组件（在班级卡片下方展开）
// ================================================================

import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getStudentClassResources, saveResourceToKnowledge } from '@/api/modules/class'
import { downloadResource } from '@/api/modules/teachingResource'
import { FILE_TYPE_ICONS, FILE_TYPE_LABELS } from '@/types'
import type { IClassResourceItem } from '@/types'

const props = defineProps<{ classId: string; className: string }>()

const router = useRouter()
const resources = ref<IClassResourceItem[]>([])
const loading = ref(false)
const savingId = ref<string | null>(null)

async function fetchResources() {
  loading.value = true
  try {
    const res = await getStudentClassResources(props.classId)
    resources.value = res?.items || []
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

async function handleSaveToKnowledge(item: IClassResourceItem) {
  savingId.value = item.resource_id
  try {
    const result = await saveResourceToKnowledge(props.classId, item.resource_id)
    ElMessage.success(`已保存「${result.filename}」到知识库`)
  } catch {
    // 错误已在拦截器中处理
  } finally {
    savingId.value = null
  }
}

function handleDownload(item: IClassResourceItem) {
  downloadResource(item.resource_id, item.resource_file_name).catch(() => {})
}

function goToKnowledge() {
  router.push('/knowledge')
}

function fmtSize(b: number): string {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// 当 classId 变化时重新加载
watch(() => props.classId, () => { fetchResources() }, { immediate: true })
</script>

<template>
  <div class="class-resources" v-loading="loading">
    <!-- 空状态 -->
    <div v-if="!loading && !resources.length" class="cr-empty">
      <span>该班级暂无共享资源</span>
    </div>

    <!-- 资源列表 -->
    <div v-else class="cr-list">
      <div
        v-for="item in resources"
        :key="item.id"
        class="cr-item"
      >
        <div class="cr-item__icon">
          <el-icon :size="28"><component :is="FILE_TYPE_ICONS[item.resource_file_type] || 'Document'" /></el-icon>
        </div>
        <div class="cr-item__info">
          <div class="cr-item__title">{{ item.resource_title }}</div>
          <div class="cr-item__meta">
            <el-tag size="small" type="info">{{ item.resource_subject }}</el-tag>
            <el-tag size="small" type="info">{{ item.resource_grade }}</el-tag>
            <span>{{ item.resource_file_name }}</span>
            <span>{{ fmtSize(item.resource_file_size) }}</span>
            <span class="cr-item__time">{{ fmtDate(item.created_at) }}</span>
          </div>
        </div>
        <div class="cr-item__actions">
          <el-button size="small" type="primary" @click="handleDownload(item)">
            <el-icon :size="14"><Download /></el-icon>
            下载
          </el-button>
          <el-button
            size="small"
            type="success"
            :loading="savingId === item.resource_id"
            @click="handleSaveToKnowledge(item)"
          >
            <el-icon :size="14"><FolderAdd /></el-icon>
            保存到知识库
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="resources.length > 0" class="cr-footer">
      <el-button link type="primary" size="small" @click="goToKnowledge">
        前往知识库查看 →
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.class-resources {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
}

.cr-empty {
  padding: var(--spacing-base);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-placeholder);
}

.cr-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cr-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-primary-lighter);
  }

  &__icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-card);
    border-radius: var(--radius-sm);
    color: var(--color-primary);
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    flex-wrap: wrap;
  }

  &__time {
    color: var(--color-text-placeholder);
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}

.cr-footer {
  text-align: center;
  padding-top: var(--spacing-sm);
}

@media (max-width: 768px) {
  .cr-item {
    flex-direction: column;
    align-items: flex-start;

    &__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
