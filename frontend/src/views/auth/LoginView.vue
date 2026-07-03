<script setup lang="ts">
// ================================================================
// LoginView — 登录页面
// 对应 PBI_01：用户登录
// ================================================================

import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// ── 表单数据 ──
const formRef = ref<FormInstance>()
const form = reactive({
  login: '',
  password: '',
  rememberMe: false,
})

const rules: FormRules = {
  login: [
    { required: true, message: '请输入邮箱或手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const loading = ref(false)

// ── 登录 ──
async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // TODO: 调用真实登录 API
    // const res = await login({ login: form.login, password: form.password })
    // userStore.setAuth(res.data.access_token, res.data.user)

    // Mock 登录（开发阶段）
    ElMessage.success('登录成功（Mock）')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败，请重试')
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
        <router-link to="/" class="auth-card__logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <rect width="48" height="48" rx="12" fill="var(--color-primary)" />
            <path
              d="M24 10C20 18 14 22 12 26C10 30 12 38 24 38C36 38 38 30 36 26C34 22 28 18 24 10Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="19" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
            <circle cx="29" cy="25" r="2.5" fill="var(--color-primary-darkest)" />
          </svg>
          <span class="auth-card__logo-text">智翼 ZhiYi</span>
        </router-link>
        <h2>欢迎回来</h2>
        <p>登录你的账号，继续学习之旅</p>
      </div>

      <!-- 表单 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="邮箱 / 手机号" prop="login">
          <el-input v-model="form.login" placeholder="请输入邮箱或手机号" :prefix-icon="User" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="auth-card__options">
          <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
          <router-link to="/forgot-password" class="auth-card__link">忘记密码？</router-link>
        </div>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="auth-card__submit"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>

      <!-- 底部链接 -->
      <div class="auth-card__footer">
        还没有账号？
        <router-link to="/register" class="auth-card__link">立即注册</router-link>
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
    margin-bottom: var(--spacing-xxl);

    h2 {
      font-size: var(--font-size-h2);
      margin-top: var(--spacing-lg);
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
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }
  }

  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
  }

  &__submit {
    width: 100%;
  }

  &__footer {
    text-align: center;
    margin-top: var(--spacing-xl);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover {
      text-decoration: underline;
    }
  }
}

// 移动端缩小内边距
@media (max-width: 480px) {
  .auth-card {
    padding: var(--spacing-xl);
  }
}
</style>
