<script setup lang="ts">
/** 试卷详情页 */

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExamPaperDetail, exportExamPaper } from '@/api/modules/examPaper'
import { ElMessage } from 'element-plus'
import type { IExamPaperDetail } from '@/types'
import { EXAM_TYPE_LABELS, type ExamType } from '@/types'
import ExamPreview from './components/ExamPreview.vue'

const route = useRoute()
const router = useRouter()
const paperId = route.params.id as string

const detail = ref<IExamPaperDetail | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    detail.value = await getExamPaperDetail(paperId)
  } catch {
    error.value = '试卷不存在或无权查看'
  } finally {
    loading.value = false
  }
})

async function handleExport() {
  try {
    const blob = await exportExamPaper(paperId, 'word')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `试卷_${detail.value?.title || paperId.slice(0, 8)}.docx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

function goBack() {
  router.push('/teacher/exam-paper')
}
</script>

<template>
  <div class="exam-detail-page">
    <div class="exam-detail-page__toolbar">
      <el-button @click="goBack">← 返回</el-button>
      <template v-if="detail">
        <span class="exam-detail-page__title">{{ detail.title }}</span>
        <span class="exam-detail-page__meta">
          {{ detail.subject }} · {{ detail.grade }} ·
          {{ EXAM_TYPE_LABELS[detail.exam_type as ExamType] || detail.exam_type }} ·
          {{ detail.total_score }}分
        </span>
      </template>
      <el-button
        v-if="detail"
        type="primary"
        style="margin-left: auto"
        @click="handleExport"
      >
        导出 Word
      </el-button>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="exam-detail-page__loading">
      <el-icon class="is-loading" :size="32"><component :is="'Loading'" /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="exam-detail-page__error">
      <el-empty :description="error" />
    </div>

    <!-- 试卷预览 -->
    <ExamPreview v-else-if="detail" :content="detail.content" />
  </div>
</template>

<style lang="scss" scoped>
.exam-detail-page {
  padding: 24px;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 12px 20px;
    background: var(--color-bg-white);
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  &__title {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__meta {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__loading, &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 0;
    font-size: 16px;
    color: var(--color-text-secondary);
  }
}
</style>
