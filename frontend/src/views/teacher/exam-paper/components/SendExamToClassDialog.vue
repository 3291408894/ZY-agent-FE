<script setup lang="ts">
// ================================================================
// 教师端 — 发送试卷到班级弹窗
// 仿照 SendToClassDialog，但调用试卷分享 API
// ================================================================

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useClassStore } from '@/stores/class'
import { sendExamPaperToClass } from '@/api/modules/examPaper'

const emit = defineEmits<{ success: [] }>()

const classStore = useClassStore()

const visible = ref(false)
const selectedClassIds = ref<string[]>([])
const sending = ref(false)
const paperId = ref<string | null>(null)

const activeClasses = computed(() =>
  classStore.teacherClasses.filter(c => c.status === 'active')
)

async function open(pid: string) {
  paperId.value = pid
  selectedClassIds.value = []
  try {
    await classStore.fetchTeacherClasses()
  } catch {
    // 加载失败会在 UI 中体现
  }
  visible.value = true
}

function close() {
  visible.value = false
}

async function handleSend() {
  if (!selectedClassIds.value.length) {
    ElMessage.warning('请至少选择一个班级')
    return
  }
  sending.value = true
  try {
    const result = await sendExamPaperToClass(paperId.value!, {
      class_ids: selectedClassIds.value,
    })
    const parts: string[] = []
    if (result.success_count > 0) parts.push(`已发送到 ${result.success_count} 个班级`)
    if (result.skipped?.length) parts.push(`${result.skipped.length} 个班级已分享过`)
    ElMessage.success(parts.join('，') || '操作完成')
    emit('success')
    close()
  } catch {
    // 错误已在拦截器中处理
  } finally {
    sending.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="发送试卷到班级"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <!-- 加载中 -->
    <div v-if="classStore.teacherClassesLoading" class="dialog-loading" v-loading="true" />

    <!-- 空状态：没有班级 -->
    <div v-else-if="!activeClasses.length" class="dialog-empty">
      <el-icon :size="48" style="color: var(--color-primary-light)"><School /></el-icon>
      <p>还没有创建班级</p>
      <p class="dialog-empty__hint">请先在「班级管理」中创建班级，再将试卷发送给学生</p>
    </div>

    <!-- 班级选择 -->
    <div v-else class="class-select-list">
      <div
        v-for="cls in activeClasses"
        :key="cls.id"
        class="class-select-item"
        :class="{ 'class-select-item--checked': selectedClassIds.includes(cls.id) }"
        @click="
          selectedClassIds.includes(cls.id)
            ? (selectedClassIds = selectedClassIds.filter(id => id !== cls.id))
            : selectedClassIds.push(cls.id)
        "
      >
        <el-checkbox :model-value="selectedClassIds.includes(cls.id)" />
        <div class="class-select-item__info">
          <span class="class-select-item__name">{{ cls.name }}</span>
          <span class="class-select-item__meta">{{ cls.grade }} · {{ cls.subject }} · {{ cls.student_count }} 名学生</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button
        type="primary"
        :loading="sending"
        :disabled="!selectedClassIds.length || !activeClasses.length"
        @click="handleSend"
      >
        发送到 {{ selectedClassIds.length ? selectedClassIds.length + ' 个班级' : '班级' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-loading {
  min-height: 200px;
}

.dialog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xxl);
  gap: var(--spacing-sm);

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
  }

  &__hint {
    font-size: var(--font-size-sm) !important;
    color: var(--color-text-placeholder) !important;
  }
}

.class-select-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 360px;
  overflow-y: auto;
}

.class-select-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  border: 1px solid transparent;

  &:hover {
    background: var(--color-bg-secondary);
  }

  &--checked {
    background: var(--color-primary-lighter);
    border-color: var(--color-primary-light);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  &__meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
}
</style>
