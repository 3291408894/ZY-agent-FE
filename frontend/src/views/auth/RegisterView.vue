<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { register } from '@/api/modules/auth'

const router = useRouter()

const GRADE_OPTIONS = ['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三']
const SUBJECT_OPTIONS = ['语文','数学','英语','物理','化学','生物','历史','地理','政治']

const step = ref(0)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'student' as 'student' | 'teacher',
  grade: '七年级',
  subjects: ['语文', '数学', '英语'] as string[],
})

const stepLabels = ['填写基本信息', '选择身份', '选择年级', '选择学科']

function toggleSubject(s: string) {
  const i = form.subjects.indexOf(s)
  if (i >= 0) {
    if (form.subjects.length > 1) form.subjects.splice(i, 1)
    else ElMessage.warning('至少选一门学科')
  } else {
    form.subjects.push(s)
  }
}

async function handleSubmit() {
  if (!form.email && !form.phone) { errorMsg.value = '请填写邮箱或手机号'; return }
  if (form.password.length < 8) { errorMsg.value = '密码至少 8 位'; return }
  if (form.password !== form.confirmPassword) { errorMsg.value = '两次密码不一致'; return }
  loading.value = true; errorMsg.value = ''
  try {
    await register({ email: form.email, phone: form.phone || undefined, password: form.password, role: form.role, grade: form.grade, subjects: form.subjects })
    ElMessage.success('注册成功！')
    router.push('/login')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || '注册失败'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card auth-card--wide">
      <div class="auth-card__header">
        <h2>创建账号</h2>
        <p>{{ stepLabels[step] }}</p>
      </div>

      <div class="step-bar">
        <div v-for="(_, i) in 4" :key="i" class="step-dot" :class="{ active: i <= step, done: i < step }" />
      </div>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" style="margin-bottom:16px" />

      <!-- Step 0: 基本信息 -->
      <div v-if="step === 0" class="step-body">
        <el-input v-model="form.email" placeholder="邮箱" size="large" style="margin-bottom:12px" />
        <el-input v-model="form.phone" placeholder="手机号（选填）" size="large" style="margin-bottom:12px" />
        <el-input v-model="form.password" type="password" placeholder="密码（至少 8 位）" show-password size="large" style="margin-bottom:12px" />
        <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" show-password size="large" />
      </div>

      <!-- Step 1: 选择身份 -->
      <div v-if="step === 1" class="step-body">
        <div class="role-selection">
          <button class="role-card" :class="{ active: form.role === 'student' }" @click="form.role = 'student'">
            <el-icon :size="40"><User /></el-icon>
            <span class="role-label">我是学生</span>
            <span class="role-desc">加入班级、完成作业、AI 辅助学习</span>
          </button>
          <button class="role-card" :class="{ active: form.role === 'teacher' }" @click="form.role = 'teacher'">
            <el-icon :size="40"><Avatar /></el-icon>
            <span class="role-label">我是教师</span>
            <span class="role-desc">管理班级、布置作业、AI 辅助教学</span>
          </button>
        </div>
      </div>

      <!-- Step 2: 选择年级 -->
      <div v-if="step === 2" class="step-body">
        <div class="chip-grid">
          <button v-for="g in GRADE_OPTIONS" :key="g" class="chip" :class="{ active: form.grade === g }" @click="form.grade = g">{{ g }}</button>
        </div>
      </div>

      <!-- Step 3: 选择学科 -->
      <div v-if="step === 3" class="step-body">
        <div class="chip-grid">
          <button v-for="s in SUBJECT_OPTIONS" :key="s" class="chip" :class="{ active: form.subjects.includes(s) }" @click="toggleSubject(s)">{{ s }}</button>
        </div>
      </div>

      <div class="auth-card__actions">
        <el-button v-if="step > 0" @click="step--" size="large">上一步</el-button>
        <el-button v-if="step < 3" type="primary" size="large" @click="step++">下一步</el-button>
        <el-button v-if="step === 3" type="primary" size="large" :loading="loading" @click="handleSubmit">完成注册</el-button>
      </div>

      <div class="auth-card__footer">已有账号？<router-link to="/login" class="auth-card__link">立即登录</router-link></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:var(--spacing-xl); background:linear-gradient(135deg,var(--color-primary-lighter),var(--color-bg),var(--color-primary-light)); }
.auth-card { width:100%; max-width:520px; background:var(--color-bg-card); border-radius:var(--radius-xl); box-shadow:var(--shadow-lg); padding:var(--spacing-xxxl);
  &__header { text-align:center; margin-bottom:var(--spacing-lg); h2 { font-size:var(--font-size-h2); margin-bottom:var(--spacing-xs); } p { color:var(--color-text-secondary); font-size:var(--font-size-sm); } }
  &__actions { display:flex; justify-content:center; gap:var(--spacing-base); margin-top:var(--spacing-xl); }
  &__footer { text-align:center; margin-top:var(--spacing-lg); font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  &__link { color:var(--color-primary); font-weight:var(--font-weight-medium); text-decoration:none; &:hover{text-decoration:underline} }
}
.step-bar { display:flex; justify-content:center; gap:var(--spacing-sm); margin-bottom:var(--spacing-xl); }
.step-dot { width:24px; height:6px; border-radius:3px; background:var(--color-border); transition:background var(--transition-fast);
  &.active { background:var(--color-primary); }
  &.done { background:var(--color-primary-light); }
}
.step-body { min-height:180px; }
.chip-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--spacing-sm); }
.chip { padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-bg-card); cursor:pointer; font-size:var(--font-size-sm); transition:all var(--transition-fast);
  &.active { background:var(--color-primary-light); border-color:var(--color-primary); color:var(--color-primary); font-weight:var(--font-weight-medium); }
  &:hover:not(.active) { border-color:var(--color-primary); }
}
.role-selection { display:flex; gap:var(--spacing-lg); justify-content:center; }
.role-card { display:flex; flex-direction:column; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-xl); border:2px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-bg-card); cursor:pointer; transition:all var(--transition-fast); width:180px;
  &.active { border-color:var(--color-primary); background:var(--color-primary-lighter); }
  &:hover:not(.active) { border-color:var(--color-primary-light); }
  .role-label { font-size:var(--font-size-base); font-weight:var(--font-weight-medium); }
  .role-desc { font-size:var(--font-size-xs); color:var(--color-text-secondary); text-align:center; line-height:1.4; }
}
</style>
