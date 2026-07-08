<script setup lang="ts">
/**
 * 智能教案生成 — 历史记录列表 (PBI_LP)
 */
import { ref, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useLessonPlanStore } from '@/stores/lessonPlan'
import { renderMarkdown } from '@/utils/markdown'
import type { ILessonPlanItem } from '@/types'

const store = useLessonPlanStore()

// ── 详情抽屉 ──
const drawerVisible = ref(false)
const viewingContent = ref('')
const viewingTitle = ref('')

// ── 初始化 ──
onMounted(() => {
  store.fetchHistory(1)
})

// ── 分页切换 ──
function handlePageChange(page: number) {
  store.fetchHistory(page)
}

// ── 查看详情 ──
async function handleViewDetail(row: ILessonPlanItem) {
  await store.fetchDetail(row.id)
  if (store.currentDetail) {
    viewingTitle.value = store.currentDetail.title
    viewingContent.value = store.currentDetail.plan_content
    drawerVisible.value = true
  }
}

// ── 删除 ──
async function handleDelete(row: ILessonPlanItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除教案「${row.title}」吗？删除后不可恢复。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    await store.removeLessonPlan(row.id)
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="lp-history">
    <!-- 空状态 -->
    <el-empty v-if="store.historyList.length === 0 && !store.historyLoading" description="暂无教案记录，快去生成第一个教案吧！" />

    <!-- 表格 -->
    <el-table
      v-else
      :data="store.historyList"
      v-loading="store.historyLoading"
      stripe
      style="width: 100%"
      size="large"
    >
      <el-table-column prop="title" label="教案标题" min-width="200">
        <template #default="{ row }">
          <span class="lp-history__title">{{ row.title }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="subject" label="学科" width="80" align="center" />

      <el-table-column prop="grade" label="年级" width="80" align="center" />

      <el-table-column prop="unit_chapter" label="单元/章节" min-width="150">
        <template #default="{ row }">
          <span v-if="row.unit_chapter">{{ row.unit_chapter }}</span>
          <span v-else class="lp-history__na">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="class_hours" label="课时" width="60" align="center" />

      <el-table-column prop="created_at" label="创建时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString('zh-CN') }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="handleViewDetail(row)"
          >
            查看
          </el-button>
          <el-button
            type="danger"
            link
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="store.historyTotal > 0" class="lp-history__pagination">
      <el-pagination
        v-model:current-page="store.historyPage"
        :total="store.historyTotal"
        :page-size="store.historyPageSize"
        :pager-count="5"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="viewingTitle"
      direction="rtl"
      size="60%"
    >
      <div
        class="lp-history__drawer-content markdown-body"
        v-html="renderMarkdown(viewingContent)"
      />
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.lp-history {
  &__title {
    font-weight: 500;
    color: var(--color-text);
  }

  &__na {
    color: var(--color-text-placeholder);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md) 0;
  }

  &__drawer-content {
    padding: var(--spacing-base);
    line-height: 1.8;

    :deep(h1) {
      font-size: 20px;
      margin: var(--spacing-md) 0;
    }

    :deep(h2) {
      font-size: 17px;
      margin: var(--spacing-md) 0;
      border-left: 3px solid var(--color-primary);
      padding-left: var(--spacing-sm);
    }

    :deep(h3) {
      font-size: 15px;
      margin: var(--spacing-sm) 0;
    }

    :deep(p) {
      margin: var(--spacing-xs) 0;
    }

    :deep(ul), :deep(ol) {
      padding-left: var(--spacing-lg);
    }

    :deep(pre) {
      background: var(--color-fill-light);
      padding: var(--spacing-sm);
      border-radius: var(--radius-sm);
      overflow-x: auto;
      font-size: 13px;
    }
  }
}
</style>
