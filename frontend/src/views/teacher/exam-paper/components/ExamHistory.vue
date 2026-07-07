<script setup lang="ts">
/** 历史试卷列表 */

import { ref, onMounted, watch } from 'vue'
import { useExamPaperStore } from '@/stores/examPaper'
import { EXAM_TYPE_LABELS, type ExamType } from '@/types'
import { exportExamPaper } from '@/api/modules/examPaper'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useExamPaperStore()

const subjectFilter = ref('')
const typeFilter = ref('')

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

onMounted(() => {
  store.fetchPapers()
})

watch([subjectFilter, typeFilter], () => {
  store.fetchPapers({
    subject: subjectFilter.value || undefined,
    exam_type: typeFilter.value || undefined,
  })
})

function viewDetail(id: string) {
  // navigate to detail page
  window.open(`/teacher/exam-paper/${id}`, '_self')
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该试卷？', '确认', { type: 'warning' })
    await store.removePaper(id)
    ElMessage.success('已删除')
  } catch { /* cancelled */ }
}

async function handleExport(id: string) {
  try {
    const blob = await exportExamPaper(id, 'word')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `试卷_${id.slice(0, 8)}.docx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="exam-history">
    <div class="exam-history__toolbar">
      <el-select
        v-model="subjectFilter"
        placeholder="学科筛选"
        clearable
        style="width: 130px"
      >
        <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select
        v-model="typeFilter"
        placeholder="考试类型"
        clearable
        style="width: 140px"
      >
        <el-option
          v-for="(label, key) in EXAM_TYPE_LABELS"
          :key="key"
          :label="label"
          :value="key"
        />
      </el-select>
      <span class="exam-history__count">共 {{ store.total }} 份试卷</span>
    </div>

    <!-- 列表 -->
    <div v-if="store.papers.length === 0 && !store.loading" class="exam-history__empty">
      <el-empty description="暂无试卷记录" />
    </div>

    <el-table
      v-else
      :data="store.papers"
      v-loading="store.loading"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="title" label="试卷标题" min-width="200" />
      <el-table-column prop="subject" label="学科" width="70" />
      <el-table-column prop="grade" label="年级" width="70" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          {{ EXAM_TYPE_LABELS[row.exam_type as ExamType] || row.exam_type }}
        </template>
      </el-table-column>
      <el-table-column prop="total_score" label="总分" width="70" />
      <el-table-column prop="question_count" label="题数" width="60" />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="viewDetail(row.id)">
            查看
          </el-button>
          <el-button size="small" type="primary" link @click="handleExport(row.id)">
            下载
          </el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="store.totalPages > 1" class="exam-history__pagination">
      <el-pagination
        v-model:current-page="store.currentPage"
        :total="store.total"
        :page-size="store.pageSize"
        layout="prev, pager, next"
        @current-change="(p: number) => store.fetchPapers({ page: p })"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exam-history {
  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__count {
    margin-left: auto;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__empty {
    padding: 60px 0;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
