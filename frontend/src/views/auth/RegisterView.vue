<script setup lang="ts">
/**
 * 注册页面 — 分步注册（身份选择优先）
 * Step 0: 身份选择 → Step 1: 基本信息 → Step 2: 角色特定信息 → Step 3: 完成
 */
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/modules/auth'

const router = useRouter()

const GRADE_OPTIONS = ['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三']
const SUBJECT_OPTIONS = ['语文','数学','英语','物理','化学','生物','历史','地理','政治','道德与法治','科学','信息技术','美术','音乐','体育']

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  // Step 0: 身份
  role: '' as 'student' | 'teacher' | '',
  // Step 1: 基本信息（公共）
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  // Step 2: 学生字段
  grade: '七年级',
  subjects: ['语文', '数学', '英语'] as string[],
  textbook_version: '',
  // Step 2: 教师字段
  teacherSubjects: ['语文'] as string[],
  school_name: '',
  bio: '',
})

// 根据角色计算总步数和当前步骤标签
const studentSteps = ['选择身份', '基本信息', '年级学科', '完成注册']
const teacherSteps = ['选择身份', '基本信息', '教学信息', '完成注册']

const currentSteps = computed(() => form.role === 'teacher' ? teacherSteps : studentSteps)
const totalSteps = computed(() => currentSteps.value.length - 1)

const step = ref(0)

/** 选择身份 */
function selectRole(role: 'student' | 'teacher') {
  form.role = role
  errorMsg.value = ''
}

function nextStep() {
  if (step.value === 0 && !form.role) {
    ElMessage.warning('请先选择您的身份')
    return
  }
  if (step.value === 1) {
    if (!form.email && !form.phone) { errorMsg.value = '请填写邮箱或手机号'; return }
    if (form.password.length < 8) { errorMsg.value = '密码至少 8 位'; return }
    if (form.password !== form.confirmPassword) { errorMsg.value = '两次密码不一致'; return }
  }
  errorMsg.value = ''
  step.value++
}

function prevStep() { step.value--; errorMsg.value = '' }

// 学生：学科选择
function toggleSubject(s: string) {
  const i = form.subjects.indexOf(s)
  if (i >= 0) {
    if (form.subjects.length > 1) form.subjects.splice(i, 1)
    else ElMessage.warning('至少选一门学科')
  } else {
    form.subjects.push(s)
  }
}

// 教师：教学科目选择（多选）
function toggleTeacherSubject(s: string) {
  const i = form.teacherSubjects.indexOf(s)
  if (i >= 0) {
    if (form.teacherSubjects.length > 1) form.teacherSubjects.splice(i, 1)
    else ElMessage.warning('至少选一门教学科目')
  } else {
    form.teacherSubjects.push(s)
  }
}

// 提交注册
async function handleSubmit() {
  loading.value = true; errorMsg.value = ''
  try {
    const payload: Record<string, unknown> = {
      email: form.email || undefined,
      phone: form.phone || undefined,
      password: form.password,
      role: form.role,
    }
    if (form.role === 'student') {
      payload.grade = form.grade
      payload.subjects = form.subjects
      payload.textbook_version = form.textbook_version || undefined
    } else {
      // 教师：subjects = 教学科目
      payload.subjects = form.teacherSubjects
      payload.school_name = form.school_name || undefined
      payload.bio = form.bio || undefined
    }
    await register(payload as any)
    ElMessage.success('注册成功！')
    router.push('/login')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.response?.data?.detail?.message || e?.message || '注册失败'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card auth-card--wide">
      <!-- Header -->
      <div class="auth-card__header">
        <h2>创建账号</h2>
        <p>{{ currentSteps[step] }}</p>
      </div>

      <!-- Step bar -->
      <div class="step-bar">
        <div v-for="(label, i) in currentSteps.slice(0, -1)" :key="i" class="step-item" :class="{ active: i <= step, done: i < step }">
          <div class="step-dot" />
          <span class="step-label">{{ label }}</span>
        </div>
      </div>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" style="margin-bottom:16px" />

      <!-- ================================================================ -->
      <!-- Step 0: 身份选择（第一步） -->
      <!-- ================================================================ -->
      <div v-if="step === 0" class="step-body">
        <p class="step-hint">请选择您的身份，我们将为您提供专属服务</p>
        <div class="role-cards">
          <button class="role-card" :class="{ active: form.role === 'student' }" @click="selectRole('student')">
            <div class="role-card__icon">🎒</div>
            <span class="role-card__label">我是学生</span>
            <span class="role-card__hint">加入班级，完成作业，AI 辅助学习</span>
          </button>
          <button class="role-card" :class="{ active: form.role === 'teacher' }" @click="selectRole('teacher')">
            <div class="role-card__icon">📚</div>
            <span class="role-card__label">我是教师</span>
            <span class="role-card__hint">管理班级，布置作业，智能备课</span>
          </button>
        </div>
      </div>

      <!-- ================================================================ -->
      <!-- Step 1: 基本信息（公共） -->
      <!-- ================================================================ -->
      <div v-if="step === 1" class="step-body">
        <el-input v-model="form.email" placeholder="邮箱" size="large" style="margin-bottom:12px" autocomplete="off" />
        <el-input v-model="form.phone" placeholder="手机号（选填）" size="large" style="margin-bottom:12px" autocomplete="off" />
        <el-input v-model="form.password" type="password" placeholder="密码（至少 8 位）" show-password size="large" style="margin-bottom:12px" autocomplete="new-password" />
        <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" show-password size="large" autocomplete="new-password" />
      </div>

      <!-- ================================================================ -->
      <!-- Step 2: 角色特定信息 -->
      <!-- ================================================================ -->

      <!-- 学生 Step 2: 年级 + 学科偏好 + 教材版本 -->
      <div v-if="step === 2 && form.role === 'student'" class="step-body">
        <div class="section">
          <label class="section__title">选择年级</label>
          <div class="chip-grid">
            <button v-for="g in GRADE_OPTIONS" :key="g" class="chip" :class="{ active: form.grade === g }" @click="form.grade = g">{{ g }}</button>
          </div>
        </div>
        <div class="section">
          <label class="section__title">学科偏好（可多选）</label>
          <div class="chip-grid chip-grid--3col">
            <button v-for="s in SUBJECT_OPTIONS" :key="s" class="chip" :class="{ active: form.subjects.includes(s) }" @click="toggleSubject(s)">{{ s }}</button>
          </div>
        </div>
        <div class="section">
          <label class="section__title">教材版本（可选）</label>
          <el-select v-model="form.textbook_version" placeholder="请选择教材版本" size="large" style="width:100%" clearable>
            <el-option v-for="v in ['部编版','人教版','北师大版','苏教版','沪教版','鲁教版','浙教版','其他']" :key="v" :label="v" :value="v" />
          </el-select>
        </div>
      </div>

      <!-- 教师 Step 2: 教学科目 + 学校名称 + 个人简介 -->
      <div v-if="step === 2 && form.role === 'teacher'" class="step-body">
        <div class="section">
          <label class="section__title">教学科目（可多选）</label>
          <div class="chip-grid chip-grid--3col">
            <button v-for="s in SUBJECT_OPTIONS" :key="s" class="chip" :class="{ active: form.teacherSubjects.includes(s) }" @click="toggleTeacherSubject(s)">{{ s }}</button>
          </div>
        </div>
        <div class="section">
          <label class="section__title">所在学校（可选）</label>
          <el-input v-model="form.school_name" placeholder="如：XX市第一中学" size="large" maxlength="64" show-word-limit />
        </div>
        <div class="section">
          <label class="section__title">个人简介（可选）</label>
          <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="简单介绍一下自己的教学经验和风格..." size="large" maxlength="256" show-word-limit />
        </div>
      </div>

      <!-- ================================================================ -->
      <!-- Step 3: 确认提交 -->
      <!-- ================================================================ -->
      <div v-if="step === 3" class="step-body step-confirm">
        <div class="confirm-card">
          <h3>确认注册信息</h3>
          <div class="confirm-row"><span>身份</span><span class="confirm-tag" :class="form.role">{{ form.role === 'teacher' ? '👨‍🏫 教师' : '🎒 学生' }}</span></div>
          <div class="confirm-row"><span>账号</span><span>{{ form.email || form.phone }}</span></div>
          <div class="confirm-row"><span>密码</span><span>••••••••</span></div>
          <template v-if="form.role === 'student'">
            <div class="confirm-row"><span>年级</span><span>{{ form.grade }}</span></div>
            <div class="confirm-row"><span>学科偏好</span><span>{{ form.subjects.join('、') }}</span></div>
            <div class="confirm-row" v-if="form.textbook_version"><span>教材版本</span><span>{{ form.textbook_version }}</span></div>
          </template>
          <template v-else>
            <div class="confirm-row"><span>教学科目</span><span>{{ form.teacherSubjects.join('、') }}</span></div>
            <div class="confirm-row" v-if="form.school_name"><span>学校</span><span>{{ form.school_name }}</span></div>
            <div class="confirm-row" v-if="form.bio"><span>简介</span><span>{{ form.bio }}</span></div>
          </template>
        </div>
      </div>

      <!-- Actions -->
      <div class="auth-card__actions">
        <el-button v-if="step > 0" @click="prevStep" size="large">上一步</el-button>
        <el-button v-if="step < totalSteps" type="primary" size="large" @click="nextStep">下一步</el-button>
        <el-button v-if="step === totalSteps" type="primary" size="large" :loading="loading" @click="handleSubmit">完成注册</el-button>
      </div>

      <div class="auth-card__footer">已有账号？<router-link to="/login" class="auth-card__link">立即登录</router-link></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:var(--spacing-xl); background:linear-gradient(135deg,var(--color-primary-lighter),var(--color-bg),var(--color-primary-light)); }
.auth-card { width:100%; max-width:560px; background:var(--color-bg-card); border-radius:var(--radius-xl); box-shadow:var(--shadow-lg); padding:var(--spacing-xxxl);
  &--wide { max-width: 600px; }
  &__header { text-align:center; margin-bottom:var(--spacing-lg); h2 { font-size:var(--font-size-h2); margin-bottom:var(--spacing-xs); } p { color:var(--color-text-secondary); font-size:var(--font-size-sm); } }
  &__actions { display:flex; justify-content:center; gap:var(--spacing-base); margin-top:var(--spacing-xl); }
  &__footer { text-align:center; margin-top:var(--spacing-lg); font-size:var(--font-size-sm); color:var(--color-text-secondary); }
  &__link { color:var(--color-primary); font-weight:var(--font-weight-medium); text-decoration:none; &:hover{text-decoration:underline} }
}

// Step bar
.step-bar { display:flex; justify-content:center; gap:var(--spacing-lg); margin-bottom:var(--spacing-xl); }
.step-item { display:flex; flex-direction:column; align-items:center; gap:4px; color:var(--color-text-placeholder); font-size:var(--font-size-xs);
  .step-dot { width:10px; height:10px; border-radius:50%; background:var(--color-border); transition:all var(--transition-fast); }
  &.active .step-dot { background:var(--color-primary); }
  &.done .step-dot { background:var(--color-primary-light); }
  &.active .step-label, &.done .step-label { color:var(--color-primary); }
}

// Step body
.step-body { min-height:240px; }
.step-hint { text-align:center; color:var(--color-text-secondary); margin-bottom:var(--spacing-xl); font-size:var(--font-size-base); }

// Section
.section { margin-bottom:var(--spacing-xl);
  &__title { display:block; font-size:var(--font-size-sm); font-weight:var(--font-weight-medium); color:var(--color-text-primary); margin-bottom:var(--spacing-sm); }
}

// Role cards
.role-cards { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--spacing-xl);
  @media (max-width:480px){ grid-template-columns:1fr; }
}
.role-card { display:flex; flex-direction:column; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-xxl) var(--spacing-lg); border:2px solid var(--color-border); border-radius:var(--radius-lg); background:var(--color-bg-card); cursor:pointer; transition:all var(--transition-fast);
  &__icon { font-size:48px; }
  &__label { font-size:var(--font-size-lg); font-weight:var(--font-weight-semibold); color:var(--color-text-primary); }
  &__hint { font-size:var(--font-size-xs); color:var(--color-text-placeholder); text-align:center; }
  &:hover { border-color:var(--color-primary-light); transform:translateY(-2px); box-shadow:var(--shadow-md); }
  &.active { border-color:var(--color-primary); background:var(--color-primary-lighter);
    .role-card__label { color:var(--color-primary); }
  }
}

// Chip grid
.chip-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--spacing-sm);
  &--3col { grid-template-columns:repeat(3,1fr); }
}
.chip { padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-bg-card); cursor:pointer; font-size:var(--font-size-sm); transition:all var(--transition-fast);
  &.active { background:var(--color-primary-light); border-color:var(--color-primary); color:var(--color-primary); font-weight:var(--font-weight-medium); }
  &:hover:not(.active) { border-color:var(--color-primary); }
}

// Confirm card
.step-confirm { display:flex; align-items:flex-start; justify-content:center; }
.confirm-card { width:100%; padding:var(--spacing-xl); background:var(--color-bg); border-radius:var(--radius-lg); border:1px solid var(--color-border-light);
  h3 { margin:0 0 var(--spacing-lg); font-size:var(--font-size-base); color:var(--color-text-secondary); }
}
.confirm-row { display:flex; justify-content:space-between; align-items:center; padding:var(--spacing-sm) 0; border-bottom:1px solid var(--color-border-light); font-size:var(--font-size-sm);
  span:first-child { color:var(--color-text-secondary); }
  span:last-child { color:var(--color-text-primary); font-weight:var(--font-weight-medium); }
  &:last-child { border-bottom:none; }
}
.confirm-tag { padding:2px 10px; border-radius:var(--radius-sm); font-size:var(--font-size-xs);
  &.student { background:#E8F5E9; color:#2E7D32; }
  &.teacher { background:#E3F2FD; color:#1565C0; }
}
</style>
