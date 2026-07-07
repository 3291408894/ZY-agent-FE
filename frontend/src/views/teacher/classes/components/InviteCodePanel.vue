<script setup lang="ts">
/**
 * 邀请码展示面板
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useClassStore } from '@/stores/class'

const props = defineProps<{ visible: boolean; classId: string; className: string }>()
const emit = defineEmits<{ 'update:visible': [val: boolean] }>()

const classStore = useClassStore()
const code = ref('')

watch(() => props.visible, async (val) => {
  if (val && props.classId) {
    try {
      const detail = await classStore.fetchClassDetail(props.classId)
      code.value = detail.invite_code
    } catch {
      code.value = '加载失败'
    }
  }
})

function copyCode() {
  navigator.clipboard.writeText(code.value).then(() => {
    ElMessage.success('邀请码已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="班级邀请码"
    width="420px"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="invite-panel">
      <p class="tip">{{ props.className }} 的邀请码</p>
      <div class="code-box" @click="copyCode">
        <span class="big-code">{{ code }}</span>
        <el-icon><CopyDocument /></el-icon>
      </div>
      <p class="sub-tip">点击上方邀请码即可复制，分享给学生加入班级</p>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.invite-panel { text-align: center; padding: 20px 0; }
.tip { font-size: 14px; color: var(--el-text-color-secondary); margin-bottom: 16px; }
.code-box {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  border-radius: 8px;
  cursor: pointer;
  user-select: all;
}
.big-code {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 6px;
  font-family: monospace;
  color: var(--el-color-primary);
}
.sub-tip { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 12px; }
</style>
