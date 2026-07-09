<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { login } from '@/api/modules/auth'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { onLoginSuccess } = useAuth()

const formRef = ref<FormInstance>()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  login: '',
  password: '',
})

const rules: FormRules = {
  login: [{ required: true, message: '请输入邮箱或手机号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 64, message: '密码长度 8-64 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await login(form)
    onLoginSuccess(res.access_token, res.user)
    ElMessage.success(`欢迎回来，${res.user.nickname || (res.user.role === 'teacher' ? '老师' : '同学')}`)
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-card__header">
        <router-link to="/dashboard" class="auth-card__logo">
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <rect width="48" height="48" rx="12" fill="var(--color-primary)" />
            <path d="M24 10C20 18 14 22 12 26C10 30 12 38 24 38C36 38 38 30 36 26C34 22 28 18 24 10Z" fill="white" opacity="0.9" />
            <circle cx="19" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
            <circle cx="29" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
          </svg>
          <span class="auth-card__logo-text">智翼 ZhiYi</span>
        </router-link>
        <h2>欢迎回来</h2>
        <p>登录你的账号，继续学习之旅</p>
      </div>

      <!-- 错误提示 -->
      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" style="margin-bottom: 16px" />

      <!-- 表单 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="邮箱 / 手机号" prop="login">
          <el-input v-model="form.login" placeholder="请输入邮箱或手机号" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password size="large" @keyup.enter="handleLogin" />
        </el-form-item>
        <div class="auth-card__options">
          <router-link to="/forgot-password" class="auth-card__link">忘记密码？</router-link>
        </div>
        <el-button type="primary" size="large" :loading="loading" class="auth-card__submit" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>

      <div class="auth-card__footer">
        还没有账号？<router-link to="/register" class="auth-card__link">立即注册</router-link>
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
  &__header { text-align: center; margin-bottom: var(--spacing-xxl);
    h2 { font-size: var(--font-size-h2); margin: var(--spacing-lg) 0 var(--spacing-xs); }
    p { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
  }
  &__logo { display: inline-flex; align-items: center; gap: var(--spacing-sm); text-decoration: none;
    &-text { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
  }
  &__options { display: flex; justify-content: flex-end; margin-bottom: var(--spacing-lg); }
  &__submit { width: 100%; }
  &__footer { text-align: center; margin-top: var(--spacing-xl); font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  &__link { color: var(--color-primary); text-decoration: none; font-weight: var(--font-weight-medium); &:hover { text-decoration: underline; } }
}
</style>
