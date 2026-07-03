<script setup lang="ts">
// ================================================================
// RegisterView — 注册页面
// 对应 PBI_01：用户注册
// ================================================================

import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

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
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']
const selectedGrade = ref('七年级')

// ── Step 2: 学科偏好 ──
const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const selectedSubjects = ref<string[]>(['语文', '数学', '英语'])

const loading = ref(false)

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

// ── 步骤导航 ──
function nextStep() { if (step.value < 2) step.value++ }
function prevStep() { if (step.value > 0) step.value-- }

// ── 提交注册 ──
async function handleRegister() {
  loading.value = true
  try {
    // TODO: 调用真实注册 API
    ElMessage.success('注册成功！欢迎来到智翼')
    router.push('/login')
  } catch (e: any) {
    ElMessage.error(e?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}

const rules: FormRules = {
  email: [{ type: 'email', message: '请输入有效邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_r: any, v: string, cb: any) =>
        v === form.password ? cb() : cb(new Error('两次密码不一致')),
      trigger: 'blur',
    },
  ],
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card auth-card--wide">
      <!-- 步骤条 -->
      <el-steps :active="step" align-center finish-status="success">
        <el-step title="创建账号" />
        <el-step title="选择年级" />
        <el-step title="学科偏好" />
      </el-steps>

      <div class="auth-card__body">
        <!-- Step 0: 基本信息 -->
        <div v-if="step === 0" class="step-content">
          <h3>{{ STEP_TITLES[0] }}</h3>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号（选填）">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="至少 8 位" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" show-password />
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
        <el-button v-if="step > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="step < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button
          v-if="step === 2"
          type="primary"
          :loading="loading"
          @click="handleRegister"
        >
          完成注册
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
  background: linear-gradient(135deg, var(--color-primary-lighter) 0%, var(--color-bg) 50%, var(--color-primary-light) 100%);
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-xxxl);

  &--wide { max-width: 520px; }

  &__body {
    margin: var(--spacing-xxl) 0;
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
  h3 { font-size: var(--font-size-h3); margin-bottom: var(--spacing-sm); }
  .step-desc { color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-xl); }
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
  &:hover:not(.is-selected) { border-color: var(--color-primary); }
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
  &:hover:not(.is-selected) { border-color: var(--color-primary); }
}
</style>
