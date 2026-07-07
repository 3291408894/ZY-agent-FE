<script setup lang="ts">
/**
 * 学生端 — 加入班级弹窗
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useClassStore } from '@/stores/class'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; joined: [] }>()

const classStore = useClassStore()

const inviteCode = ref('')
const step = ref<'input' | 'confirm'>('input')
const classInfo = ref<{ class_name: string; teacher_name: string; subject: string; grade: string } | null>(null)
const checking = ref(false)
const joining = ref(false)

async function handleCheck() {
  if (!inviteCode.value.trim()) {
    ElMessage.warning('请输入邀请码')
    return
  }
  checking.value = true
  try {
    const info = await classStore.checkCode(inviteCode.value.trim().toUpperCase())
    classInfo.value = info
    step.value = 'confirm'
  } catch {
    ElMessage.error('邀请码无效或班级已归档')
  } finally {
    checking.value = false
  }
}

async function handleJoin() {
  joining.value = true
  try {
    await classStore.joinByCode(inviteCode.value.trim().toUpperCase())
    ElMessage.success('加入成功！')
    emit('update:visible', false)
    emit('joined')
    resetState()
  } catch (e: any) {
    ElMessage.error(e?.message || '加入失败')
  } finally {
    joining.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
  resetState()
}

function resetState() {
  step.value = 'input'
  inviteCode.value = ''
  classInfo.value = null
}
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="加入班级"
    width="420px"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <!-- 步骤1：输入邀请码 -->
    <div v-if="step === 'input'" class="join-step">
      <p class="tip">请输入教师分享的8位邀请码</p>
      <el-input
        v-model="inviteCode"
        placeholder="请输入邀请码"
        maxlength="8"
        style="font-size: 20px; text-align: center; letter-spacing: 4px"
        @keyup.enter="handleCheck"
      />
    </div>

    <!-- 步骤2：确认班级信息 -->
    <div v-else class="join-step">
      <div class="class-info-card">
        <h3>{{ classInfo?.class_name }}</h3>
        <p><strong>教师：</strong>{{ classInfo?.teacher_name }}</p>
        <p><strong>学科：</strong>{{ classInfo?.subject }}</p>
        <p><strong>年级：</strong>{{ classInfo?.grade }}</p>
      </div>
      <p class="confirm-tip">确认加入该班级吗？</p>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button v-if="step === 'input'" type="primary" :loading="checking" @click="handleCheck">
        查询班级
      </el-button>
      <el-button v-else type="primary" :loading="joining" @click="handleJoin">
        确认加入
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.join-step { padding: 20px 0; }
.tip { text-align: center; color: var(--el-text-color-secondary); margin-bottom: 16px; }
.class-info-card {
  text-align: center;
  padding: 20px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  h3 { margin: 0 0 12px; font-size: 18px; }
  p { margin: 4px 0; }
}
.confirm-tip { text-align: center; margin-top: 16px; color: var(--el-text-color-secondary); }
</style>
