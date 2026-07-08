<script setup lang="ts">
// ================================================================
// StudentRoster — 花名册表格
// 展示班级学生列表，支持移除操作
// ================================================================

import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { IRosterStudent } from '@/types'

const props = defineProps<{
  students: IRosterStudent[]
  loading: boolean
  archived: boolean
}>()

const safeStudents = computed(() => props.students || [])

const emit = defineEmits<{
  remove: [studentId: string, studentName: string]
}>()

async function handleRemove(studentId: string, studentName: string) {
  try {
    await ElMessageBox.confirm(
      `确定将「${studentName}」移出班级？`,
      '确认移除学生',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return // 用户取消
  }

  emit('remove', studentId, studentName)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="student-roster">
    <div class="student-roster__header">
      <h3 class="student-roster__title">
        班级花名册
        <span class="student-roster__count">（{{ safeStudents.length }} 人）</span>
      </h3>
    </div>

    <el-table
      :data="safeStudents"
      v-loading="loading"
      stripe
      style="width: 100%"
      empty-text="暂无学生加入"
    >
      <el-table-column label="序号" type="index" width="80" align="center" />
      <el-table-column prop="student_name" label="学生姓名" min-width="150" />
      <el-table-column label="加入时间" min-width="200">
        <template #default="{ row }">
          {{ formatDate(row.joined_at) }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="!archived"
        label="操作"
        width="120"
        align="center"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button
            type="danger"
            size="small"
            text
            @click="handleRemove(row.student_id, row.student_name)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.student-roster {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__count {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
  }
}
</style>
