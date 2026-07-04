<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendResetCode, resetPassword } from '@/api/modules/auth'

const router = useRouter()
const step = ref(0)
const loading = ref(false)
const countdown = ref(0)
const errorMsg = ref('')

const form = reactive({ email: '', code: '', newPassword: '', confirmPassword: '' })

async function handleSendCode() {
  if (!form.email) { errorMsg.value = '请输入注册邮箱'; return }
  loading.value = true; errorMsg.value = ''
  try {
    await sendResetCode(form.email)
    step.value = 1; countdown.value = 60
    ElMessage.success('验证码已发送')
    const t = setInterval(() => { if (--countdown.value <= 0) clearInterval(t) }, 1000)
  } catch (e: any) { errorMsg.value = e?.message || '发送失败' }
  finally { loading.value = false }
}

async function handleReset() {
  if (form.newPassword.length < 8) { errorMsg.value = '密码至少 8 位'; return }
  if (form.newPassword !== form.confirmPassword) { errorMsg.value = '两次密码不一致'; return }
  loading.value = true; errorMsg.value = ''
  try {
    await resetPassword({ email: form.email, code: form.code, new_password: form.newPassword })
    ElMessage.success('密码重置成功，请登录')
    router.push('/login')
  } catch (e: any) { errorMsg.value = e?.message || '重置失败' }
  finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <h2>找回密码</h2>
        <p>{{ step === 0 ? '输入注册邮箱，获取验证码' : '输入验证码和新密码' }}</p>
      </div>

      <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon closable @close="errorMsg = ''" style="margin-bottom:16px" />

      <template v-if="step === 0">
        <el-input v-model="form.email" placeholder="请输入注册邮箱" size="large" style="margin-bottom:16px" />
        <el-button type="primary" size="large" :loading="loading" class="auth-card__submit" @click="handleSendCode">发送验证码</el-button>
      </template>

      <template v-if="step === 1">
        <el-input v-model="form.code" placeholder="6 位验证码" size="large" style="margin-bottom:12px">
          <template #append>
            <el-button :disabled="countdown > 0" @click="handleSendCode" text>{{ countdown > 0 ? `${countdown}s` : '重新发送' }}</el-button>
          </template>
        </el-input>
        <el-input v-model="form.newPassword" type="password" placeholder="新密码（至少 8 位）" show-password size="large" style="margin-bottom:12px" />
        <el-input v-model="form.confirmPassword" type="password" placeholder="确认新密码" show-password size="large" style="margin-bottom:16px" />
        <el-button type="primary" size="large" :loading="loading" class="auth-card__submit" @click="handleReset">重置密码</el-button>
      </template>

      <div class="auth-card__footer"><router-link to="/login" class="auth-card__link">返回登录</router-link></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:var(--spacing-xl); background:linear-gradient(135deg,var(--color-primary-lighter),var(--color-bg),var(--color-primary-light)); }
.auth-card { width:100%; max-width:420px; background:var(--color-bg-card); border-radius:var(--radius-xl); box-shadow:var(--shadow-lg); padding:var(--spacing-xxxl);
  &__header { text-align:center; margin-bottom:var(--spacing-xxl); h2 { font-size:var(--font-size-h2); margin-bottom:var(--spacing-xs); } p { color:var(--color-text-secondary); font-size:var(--font-size-sm); } }
  &__submit { width:100%; }
  &__footer { text-align:center; margin-top:var(--spacing-xl); }
  &__link { color:var(--color-primary); text-decoration:none; font-weight:var(--font-weight-medium); &:hover{text-decoration:underline} }
}
</style>
