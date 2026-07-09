<script setup lang="ts">
// ================================================================
// 学生端 — 班级资源列表组件（含教学资源 + 试卷）
// ================================================================

import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getStudentClassResources, saveResourceToKnowledge, getStudentClassExamPapers, downloadStudentExamPaper } from '@/api/modules/class'
import { downloadResource } from '@/api/modules/teachingResource'
import { FILE_TYPE_ICONS, FILE_TYPE_LABELS, EXAM_TYPE_LABELS, type ExamType } from '@/types'
import type { IClassResourceItem, IClassExamPaperItem } from '@/types'

const props = defineProps<{ classId: string; className: string }>()

const router = useRouter()
const resources = ref<IClassResourceItem[]>([])
const examPapers = ref<IClassExamPaperItem[]>([])
const loading = ref(false)
const savingId = ref<string | null>(null)
const downloadingId = ref<string | null>(null)

// 合并两种资源的统一列表
interface DisplayItem {
  type: 'resource' | 'exam_paper'
  createdAt: string
  data: IClassResourceItem | IClassExamPaperItem
}

const displayItems = computed<DisplayItem[]>(() => {
  const resourceItems: DisplayItem[] = resources.value.map(r => ({
    type: 'resource' as const,
    createdAt: r.created_at || '',
    data: r,
  }))
  const paperItems: DisplayItem[] = examPapers.value.map(p => ({
    type: 'exam_paper' as const,
    createdAt: p.created_at || '',
    data: p,
  }))
  return [...resourceItems, ...paperItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

async function fetchAll() {
  loading.value = true
  try {
    const [resData, epData] = await Promise.all([
      getStudentClassResources(props.classId).catch(() => ({ items: [] })),
      getStudentClassExamPapers(props.classId).catch(() => ({ items: [] })),
    ])
    resources.value = resData?.items || []
    examPapers.value = epData?.items || []
  } catch {
    resources.value = []
    examPapers.value = []
  } finally {
    loading.value = false
  }
}

// ── 教学资源操作 ──

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

function handleDownloadResource(item: IClassResourceItem) {
  downloadResource(item.resource_id, item.resource_file_name).catch(() => {})
}

// ── 试卷操作 ──

function handleViewExamPaper(item: IClassExamPaperItem) {
  ElMessageBox.alert(
    `<div style="line-height:2">
      <p><strong>标题：</strong>${item.title}</p>
      <p><strong>学科：</strong>${item.subject}</p>
      <p><strong>年级：</strong>${item.grade}</p>
      <p><strong>类型：</strong>${EXAM_TYPE_LABELS[item.exam_type as ExamType] || item.exam_type}</p>
      <p><strong>总分：</strong>${item.total_score} 分</p>
    </div>`,
    '试卷详情',
    { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
  )
}

async function handleDownloadExamPaper(item: IClassExamPaperItem) {
  downloadingId.value = item.exam_paper_id
  try {
    await downloadStudentExamPaper(props.classId, item.exam_paper_id)
    ElMessage.success('下载成功')
  } catch {
    // 错误已在拦截器中处理
  } finally {
    downloadingId.value = null
  }
}

// ── 工具函数 ──

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

const isResource = (item: DisplayItem): item is DisplayItem & { type: 'resource'; data: IClassResourceItem } =>
  item.type === 'resource'
const isExamPaper = (item: DisplayItem): item is DisplayItem & { type: 'exam_paper'; data: IClassExamPaperItem } =>
  item.type === 'exam_paper'

watch(() => props.classId, () => { fetchAll() }, { immediate: true })
</script>

<template>
  <div class="class-resources" v-loading="loading">
    <!-- 空状态 -->
    <div v-if="!loading && !displayItems.length" class="cr-empty">
      <span>该班级暂无共享资源</span>
    </div>

    <!-- 统一列表 -->
    <div v-else class="cr-list">
      <div
        v-for="item in displayItems"
        :key="item.type + '_' + item.data.id"
        class="cr-item"
      >
        <!-- 图标 -->
        <div class="cr-item__icon">
          <el-icon :size="28">
            <component :is="
              isResource(item)
                ? (FILE_TYPE_ICONS[item.data.resource_file_type] || 'Document')
                : 'EditPen'
            " />
          </el-icon>
        </div>

        <!-- 信息 -->
        <div class="cr-item__info">
          <div class="cr-item__title">
            {{ isResource(item) ? item.data.resource_title : item.data.title }}
          </div>
          <div class="cr-item__meta">
            <template v-if="isResource(item)">
              <el-tag size="small" type="info">{{ item.data.resource_subject }}</el-tag>
              <el-tag size="small" type="info">{{ item.data.resource_grade }}</el-tag>
              <span>{{ item.data.resource_file_name }}</span>
              <span>{{ fmtSize(item.data.resource_file_size) }}</span>
            </template>
            <template v-else>
              <el-tag size="small" type="warning">{{ item.data.subject }}</el-tag>
              <el-tag size="small" type="warning">{{ item.data.grade }}</el-tag>
              <el-tag size="small" type="info">{{ EXAM_TYPE_LABELS[item.data.exam_type as ExamType] || item.data.exam_type }}</el-tag>
              <span>{{ item.data.total_score }} 分</span>
            </template>
            <span class="cr-item__time">{{ fmtDate(item.createdAt) }}</span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="cr-item__actions">
          <template v-if="isResource(item)">
            <el-button size="small" type="primary" @click="handleDownloadResource(item.data)">
              <el-icon :size="14"><Download /></el-icon>
              下载
            </el-button>
            <el-button
              size="small"
              type="success"
              :loading="savingId === item.data.resource_id"
              @click="handleSaveToKnowledge(item.data)"
            >
              <el-icon :size="14"><FolderAdd /></el-icon>
              保存到知识库
            </el-button>
          </template>
          <template v-else>
            <el-button size="small" type="primary" @click="handleViewExamPaper(item.data)">
              <el-icon :size="14"><View /></el-icon>
              查看
            </el-button>
            <el-button
              size="small"
              type="primary"
              :loading="downloadingId === item.data.exam_paper_id"
              @click="handleDownloadExamPaper(item.data)"
            >
              <el-icon :size="14"><Download /></el-icon>
              下载
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="displayItems.length > 0" class="cr-footer">
      <el-button link type="primary" size="small" @click="goToKnowledge">
        前往知识库查看 &rarr;
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
