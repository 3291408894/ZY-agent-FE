<script setup lang="ts">
// ================================================================
// ForgotPasswordView — 找回密码页面
// ================================================================
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()
const form = reactive({ email: '', code: '', newPassword: '' })
const step = ref(0) // 0: 输入邮箱, 1: 验证码+新密码
const sending = ref(false)
const countdown = ref(0)

function sendCode() {
  sending.value = true
  countdown.value = 60
  // TODO: 调用发送验证码 API
  ElMessage.success('验证码已发送（Mock）')
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) { clearInterval(timer); sending.value = false }
  }, 1000)
  step.value = 1
}

async function resetPassword() {
  // TODO: 调用重置密码 API
  ElMessage.success('密码重置成功，请登录')
  step.value = 0
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <h2>找回密码</h2>
        <p>{{ step === 0 ? '输入注册邮箱获取验证码' : '输入验证码和新密码' }}</p>
      </div>

      <el-form ref="formRef" :model="form" label-position="top" @submit.prevent>
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入注册邮箱" />
        </el-form-item>

        <template v-if="step === 1">
          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="6 位验证码" />
              <el-button :disabled="sending" @click="sendCode">
                {{ sending ? `${countdown}s` : '重新发送' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="form.newPassword" type="password" placeholder="至少 8 位" show-password />
          </el-form-item>
        </template>

        <el-button type="primary" size="large" class="auth-card__submit" @click="step === 0 ? sendCode() : resetPassword()">
          {{ step === 0 ? '发送验证码' : '重置密码' }}
        </el-button>
      </el-form>

      <div class="auth-card__footer">
        <router-link to="/login" class="auth-card__link">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center;
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-bg) 50%, var(--color-primary-light) 100%);
}
.auth-card {
  width: 100%; max-width: 420px; background: var(--color-bg-card); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg); padding: var(--spacing-xxxl);
  &__header { text-align: center; margin-bottom: var(--spacing-xxl); h2 { margin-bottom: var(--spacing-xs); } p { color: var(--color-text-secondary); font-size: var(--font-size-sm); } }
  &__submit { width: 100%; margin-top: var(--spacing-base); }
  &__footer { text-align: center; margin-top: var(--spacing-xl); }
  &__link { color: var(--color-primary); text-decoration: none; &:hover { text-decoration: underline; } }
}
.code-row { display: flex; gap: var(--spacing-sm); .el-button { flex-shrink: 0; } }
</style>
