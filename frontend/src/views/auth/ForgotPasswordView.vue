<script setup lang="ts">
// ================================================================
// ForgotPasswordView — 找回密码页面
// 对应 PBI_01：找回密码
// 与 认证模块接口说明书.md §3.3 对齐
// 注意：后端标注 "TODO: Sprint 1 实现"，前端先准备好完整页面
// ================================================================

import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { sendResetCode, resetPassword } from '@/api/modules/auth'

const router = useRouter()

const formRef = ref<FormInstance>()
const form = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// step 0: 输入邮箱 → 发送验证码
// step 1: 输入验证码 + 新密码 → 重置
const step = ref(0)
const sending = ref(false)
const countdown = ref(0)
const loading = ref(false)
const errorMessage = ref('')

let countdownTimer: ReturnType<typeof setInterval> | null = null

// ── 表单校验 ──
const validatePassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入新密码'))
  } else if (value.length < 8 || value.length > 64) {
    callback(new Error('密码长度 8-64 位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请确认新密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效邮箱地址', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// ── 发送验证码 ──
async function handleSendCode() {
  errorMessage.value = ''

  // 校验邮箱
  if (!form.email.trim()) {
    ElMessage.warning('请输入注册邮箱')
    return
  }

  sending.value = true
  try {
    await sendResetCode(form.email.trim())
    ElMessage.success('验证码已发送至邮箱，请查收')
    step.value = 1

    // 60 秒倒计时
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer)
        sending.value = false
      }
    }, 1000)
  } catch (e: any) {
    errorMessage.value = e?.message || '发送验证码失败，请稍后再试'
    sending.value = false
  }
}

// ── 重置密码 ──
async function handleResetPassword() {
  errorMessage.value = ''

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await resetPassword({
      email: form.email.trim(),
      code: form.code.trim(),
      new_password: form.newPassword,
    })

    ElMessage.success('密码重置成功，请使用新密码登录')
    router.push('/login')
  } catch (e: any) {
    errorMessage.value = e?.message || '重置密码失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// ── 返回修改邮箱 ──
function goBack() {
  step.value = 0
  errorMessage.value = ''
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- 头部 -->
      <div class="auth-card__header">
        <router-link to="/" class="auth-card__logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
            <rect width="48" height="48" rx="12" fill="var(--color-primary)" />
            <path d="M24 10C20 18 14 22 12 26C10 30 12 38 24 38C36 38 38 30 36 26C34 22 28 18 24 10Z" fill="white" opacity="0.9" />
            <circle cx="19" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
            <circle cx="29" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
          </svg>
          <span class="auth-card__logo-text">智翼 ZhiYi</span>
        </router-link>
        <h2>找回密码</h2>
        <p>{{ step === 0 ? '输入注册邮箱获取验证码' : '输入验证码并设置新密码' }}</p>
      </div>

      <!-- 步骤指示 -->
      <el-steps :active="step" align-center finish-status="success" class="auth-card__steps">
        <el-step title="验证邮箱" />
        <el-step title="重置密码" />
      </el-steps>

      <!-- 错误提示 -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="true"
        class="auth-card__error"
        @close="errorMessage = ''"
      />

      <!-- 表单 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <!-- Step 0: 输入邮箱 -->
        <template v-if="step === 0">
          <el-form-item label="注册邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册时使用的邮箱"
              size="large"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="sending"
            class="auth-card__submit"
            @click="handleSendCode"
          >
            {{ sending ? `发送中...` : '发送验证码' }}
          </el-button>
        </template>

        <!-- Step 1: 验证码 + 新密码 -->
        <template v-if="step === 1">
          <!-- 显示目标邮箱 -->
          <div class="target-email">
            <el-icon><Message /></el-icon>
            验证码已发送至 <strong>{{ form.email }}</strong>
            <button class="target-email__change" @click="goBack">修改</button>
          </div>

          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input
                v-model="form.code"
                placeholder="请输入 6 位验证码"
                size="large"
                maxlength="6"
              />
              <el-button
                size="large"
                :disabled="sending"
                @click="handleSendCode"
              >
                {{ sending ? `${countdown}s 后重发` : '重新发送' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="8-64 位，建议包含大小写字母和数字"
              show-password
              size="large"
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入新密码"
              show-password
              size="large"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="auth-card__submit"
            @click="handleResetPassword"
          >
            {{ loading ? '重置中...' : '重置密码' }}
          </el-button>
        </template>
      </el-form>

      <!-- 底部链接 -->
      <div class="auth-card__footer">
        <router-link to="/login" class="auth-card__link">← 返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  background: linear-gradient(
    135deg,
    var(--color-primary-lighter) 0%,
    var(--color-bg) 50%,
    var(--color-primary-light) 100%
  );
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xxxl);

  &__header {
    text-align: center;
    margin-bottom: var(--spacing-lg);

    h2 {
      font-size: var(--font-size-h2);
      margin-top: var(--spacing-md);
      margin-bottom: var(--spacing-xs);
    }

    p {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    text-decoration: none;

    &-text {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }
  }

  &__steps {
    margin-bottom: var(--spacing-xl);
  }

  &__error {
    margin-bottom: var(--spacing-base);
  }

  &__submit {
    width: 100%;
    margin-top: var(--spacing-base);
  }

  &__footer {
    text-align: center;
    margin-top: var(--spacing-xl);
  }

  &__link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover { text-decoration: underline; }
  }
}

// ── 验证码行 ──
.code-row {
  display: flex;
  gap: var(--spacing-sm);

  .el-button {
    flex-shrink: 0;
  }
}

// ── 目标邮箱提示 ──
.target-email {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-primary-lighter);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-primary);
  }

  &__change {
    margin-left: auto;
    color: var(--color-primary);
    cursor: pointer;
    font-size: var(--font-size-xs);
    border: none;
    background: transparent;

    &:hover { text-decoration: underline; }
  }
}
</style>
