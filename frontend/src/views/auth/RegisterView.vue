<script setup lang="ts">
// ================================================================
// RegisterView — 注册页面
// 对应 PBI_01：用户注册
// 与 认证模块接口说明书.md §3.1 对齐
// ================================================================

import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { register } from '@/api/modules/auth'

const router = useRouter()

const STEP_TITLES = ['创建账号', '设置年级', '选择学科']

const step = ref(0)
const formRef = ref<FormInstance>()

// ── Step 0: 基本信息 ──
const form = reactive({
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

// ── Step 1: 年级选择 ──
const grades = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级', '高一', '高二', '高三',
]
const selectedGrade = ref('七年级')

// ── Step 2: 学科偏好 ──
const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const selectedSubjects = ref<string[]>(['语文', '数学', '英语'])

const loading = ref(false)
const errorMessage = ref('')

function toggleSubject(subject: string) {
  const idx = selectedSubjects.value.indexOf(subject)
  if (idx >= 0) {
    if (selectedSubjects.value.length > 1) {
      selectedSubjects.value.splice(idx, 1)
    } else {
      ElMessage.warning('至少选择一门学科')
    }
  } else {
    selectedSubjects.value.push(subject)
  }
}

// ── 校验 ──

/** Step 0 校验：邮箱/手机号至少填一个 + 密码合规 */
const emailOrPhoneRequired = (_rule: any, _value: string, callback: (err?: Error) => void) => {
  if (!form.email.trim() && !form.phone.trim()) {
    callback(new Error('邮箱和手机号至少填写一个'))
  } else {
    callback()
  }
}

const validatePassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    callback(new Error('密码至少 8 位'))
  } else if (value.length > 64) {
    callback(new Error('密码不能超过 64 位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== form.password) {
    callback(new Error('两次密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  email: [
    { validator: emailOrPhoneRequired, trigger: 'blur' },
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// ── 步骤导航 ──
function nextStep() {
  if (step.value === 0) {
    // 校验邮箱/手机号至少一个
    if (!form.email.trim() && !form.phone.trim()) {
      ElMessage.warning('请至少填写邮箱或手机号中的一个')
      return
    }
    // 校验密码
    if (!form.password || form.password.length < 8) {
      ElMessage.warning('密码至少 8 位')
      return
    }
    if (form.password !== form.confirmPassword) {
      ElMessage.warning('两次密码输入不一致')
      return
    }
  }
  if (step.value < 2) step.value++
}

function prevStep() {
  if (step.value > 0) step.value--
  errorMessage.value = ''
}

// ── 提交注册 ──
async function handleRegister() {
  errorMessage.value = ''

  if (selectedSubjects.value.length === 0) {
    ElMessage.warning('请至少选择一门学科')
    return
  }

  loading.value = true
  try {
    await register({
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      password: form.password,
      grade: selectedGrade.value,
      subjects: selectedSubjects.value,
    })

    ElMessage.success('注册成功！请登录你的账号')
    router.push('/login')
  } catch (e: any) {
    const msg = e?.message || '注册失败，请重试'
    if (msg.includes('已被注册') || msg.includes('已存在')) {
      errorMessage.value = '该邮箱或手机号已被注册，请直接登录或更换后重试'
    } else {
      errorMessage.value = msg
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card auth-card--wide">
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
        <h2>创建账号</h2>
        <p>加入智翼，开启 AI 学习之旅</p>
      </div>

      <!-- 步骤条 -->
      <el-steps :active="step" align-center finish-status="success" class="auth-card__steps">
        <el-step title="创建账号" />
        <el-step title="选择年级" />
        <el-step title="学科偏好" />
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

      <div class="auth-card__body">
        <!-- Step 0: 基本信息 -->
        <div v-if="step === 0" class="step-content">
          <h3>{{ STEP_TITLES[0] }}</h3>
          <p class="step-desc">邮箱和手机号至少填写一个，用于登录和找回密码</p>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" size="large" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号（选填）" size="large" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="8-64 位，建议包含大小写字母和数字"
                show-password
                size="large"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                show-password
                size="large"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 1: 年级选择 -->
        <div v-if="step === 1" class="step-content">
          <h3>{{ STEP_TITLES[1] }}</h3>
          <p class="step-desc">选择你所在的年级，我们会为你匹配合适的学习内容</p>
          <div class="grade-grid">
            <button
              v-for="g in grades"
              :key="g"
              class="grade-chip"
              :class="{ 'is-selected': selectedGrade === g }"
              @click="selectedGrade = g"
            >
              {{ g }}
            </button>
          </div>
        </div>

        <!-- Step 2: 学科偏好 -->
        <div v-if="step === 2" class="step-content">
          <h3>{{ STEP_TITLES[2] }}</h3>
          <p class="step-desc">选择你感兴趣的学科（后续可随时修改）</p>
          <div class="subject-grid">
            <button
              v-for="s in allSubjects"
              :key="s"
              class="subject-chip"
              :class="{ 'is-selected': selectedSubjects.includes(s) }"
              @click="toggleSubject(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="auth-card__actions">
        <el-button v-if="step > 0" @click="prevStep" size="large">上一步</el-button>
        <el-button v-if="step < 2" type="primary" size="large" @click="nextStep">下一步</el-button>
        <el-button
          v-if="step === 2"
          type="primary"
          size="large"
          :loading="loading"
          @click="handleRegister"
        >
          {{ loading ? '注册中...' : '完成注册' }}
        </el-button>
      </div>

      <div class="auth-card__footer">
        已有账号？
        <router-link to="/login" class="auth-card__link">立即登录</router-link>
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
  max-width: 480px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xxxl);

  &--wide { max-width: 520px; }

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
    margin-bottom: var(--spacing-lg);
  }

  &__error {
    margin-bottom: var(--spacing-base);
  }

  &__body {
    margin: var(--spacing-xl) 0;
    min-height: 240px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-base);
  }

  &__footer {
    text-align: center;
    margin-top: var(--spacing-lg);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__link {
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

.step-content {
  h3 {
    font-size: var(--font-size-h3);
    margin-bottom: var(--spacing-sm);
  }

  .step-desc {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-xl);
  }
}

.grade-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.grade-chip {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);

  &.is-selected {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
  }

  &:hover:not(.is-selected) {
    border-color: var(--color-primary);
  }
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.subject-chip {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);

  &.is-selected {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
  }

  &:hover:not(.is-selected) {
    border-color: var(--color-primary);
  }
}

// 移动端适配
@media (max-width: 480px) {
  .auth-card {
    padding: var(--spacing-xl);
  }

  .grade-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
