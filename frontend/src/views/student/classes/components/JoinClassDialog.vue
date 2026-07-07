<script setup lang="ts">
// ================================================================
// JoinClassDialog — 学生加入班级弹窗
// 输入邀请码 → 确认班级信息 → 加入
// ================================================================

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { joinClass } from '@/api/modules/class'
import { useClassStore } from '@/stores/class'

const emit = defineEmits<{
  success: [classId: string, className: string]
}>()

const visible = ref(false)
const loading = ref(false)
const inviteCode = ref('')
const errorMsg = ref('')

const classStore = useClassStore()

function open() {
  inviteCode.value = ''
  errorMsg.value = ''
  visible.value = true
}

function handleCodeInput(value: string) {
  // 自动转为大写，限制 8 位字母数字
  inviteCode.value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  errorMsg.value = ''
}

async function handleJoin() {
  const code = inviteCode.value.trim()
  if (!code) {
    errorMsg.value = '请输入邀请码'
    return
  }
  if (code.length !== 8) {
    errorMsg.value = '邀请码为 8 位字符'
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const data = await joinClass({ invite_code: code })
    ElMessage.success(`成功加入「${data.class_name}」`)
    visible.value = false
    emit('success', data.class_id, data.class_name)
  } catch (err: any) {
    errorMsg.value = err?.message || '加入失败，请检查邀请码是否正确'
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="加入班级"
    width="460px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="inviteCode = ''; errorMsg = ''"
  >
    <div class="join-dialog">
      <div class="join-dialog__icon">
        <el-icon :size="48" color="var(--color-primary)">
          <School />
        </el-icon>
      </div>

      <p class="join-dialog__desc">
        请输入老师提供的 8 位班级邀请码
      </p>

      <div class="join-dialog__input-wrapper">
        <el-input
          v-model="inviteCode"
          placeholder="请输入 8 位邀请码"
          maxlength="8"
          size="large"
          class="join-dialog__input"
          :class="{ 'is-error': !!errorMsg }"
          @input="handleCodeInput"
          @keyup.enter="handleJoin"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
        <p v-if="errorMsg" class="join-dialog__error">{{ errorMsg }}</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false" :disabled="loading">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="inviteCode.length !== 8"
        @click="handleJoin"
      >
        确认加入
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.join-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-lg) 0;

  &__icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--color-primary-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-lg);
  }

  &__desc {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xl);
  }

  &__input-wrapper {
    width: 100%;
    max-width: 320px;
  }

  &__input {
    :deep(.el-input__inner) {
      text-align: center;
      font-family: var(--font-family-code);
      font-size: 24px;
      font-weight: var(--font-weight-bold);
      letter-spacing: 8px;
      text-transform: uppercase;
    }

    &.is-error :deep(.el-input__inner) {
      border-color: var(--color-danger);
    }
  }

  &__error {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    margin: var(--spacing-sm) 0 0;
  }
}
</style>
