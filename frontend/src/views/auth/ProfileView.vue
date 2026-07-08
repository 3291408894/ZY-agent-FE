<script setup lang="ts">
/**
 * 个人中心 & 账号设置页面
 * Tab 1: 个人资料（查看/编辑）
 * Tab 2: 账号安全（修改密码）
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getProfile, updateProfile, changePassword } from '@/api/modules/auth'

const userStore = useUserStore()

// ── 活动 Tab ──
const activeTab = ref<'profile' | 'password'>('profile')

// ── 年级 & 学科选项 ──
const GRADE_OPTIONS = ['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三']
const SUBJECT_OPTIONS = ['语文','数学','英语','物理','化学','生物','历史','地理','政治','道德与法治','科学','信息技术','美术','音乐','体育']
const TEXTBOOK_VERSIONS = ['部编版','人教版','北师大版','苏教版','沪教版','鲁教版','浙教版','其他']

const isTeacher = computed(() => userStore.isTeacher)

// ── 表单状态 ──
const form = reactive({
  nickname: '',
  grade: '',
  subjects: [] as string[],
  textbook_version: '',
  school_name: '',
  bio: '',
})

const pageLoading = ref(true)
const editLoading = ref(false)
const isEditing = ref(false)

// ── 加载资料 ──
async function loadProfile() {
  pageLoading.value = true
  try {
    const data = await getProfile()
    form.nickname = data.nickname || ''
    form.grade = data.grade || ''
    form.subjects = data.subjects || []
    form.textbook_version = data.textbook_version || ''
    form.school_name = (data as any).school_name || ''
    form.bio = (data as any).bio || ''
    userStore.setProfile(data)
  } catch {
    // 错误由拦截器统一处理
  } finally {
    pageLoading.value = false
  }
}

// ── 学科选择 ──
function toggleSubject(s: string) {
  const i = form.subjects.indexOf(s)
  if (i >= 0) {
    if (form.subjects.length > 1) form.subjects.splice(i, 1)
    else ElMessage.warning('至少选一门')
  } else {
    form.subjects.push(s)
  }
}

// ── 保存资料 ──
async function handleSave() {
  editLoading.value = true
  try {
    const payload: Record<string, unknown> = {
      nickname: form.nickname.trim() || undefined,
      grade: form.grade || undefined,
      subjects: form.subjects.length > 0 ? form.subjects : undefined,
      textbook_version: form.textbook_version || undefined,
      school_name: form.school_name || undefined,
      bio: form.bio || undefined,
    }
    const updated = await updateProfile(payload as any)
    userStore.setProfile(updated)
    ElMessage.success('个人资料已更新')
    isEditing.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '更新失败')
  } finally {
    editLoading.value = false
  }
}

// ── 取消编辑 ──
function handleCancel() {
  isEditing.value = false
  loadProfile()
}

// ── 修改密码 ──
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdLoading = ref(false)

async function handleChangePassword() {
  if (pwdForm.newPassword.length < 8) { ElMessage.warning('新密码至少 8 位'); return }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) { ElMessage.warning('两次密码不一致'); return }
  pwdLoading.value = true
  try {
    await changePassword({ old_password: pwdForm.oldPassword, new_password: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    pwdForm.oldPassword = ''; pwdForm.newPassword = ''; pwdForm.confirmPassword = ''
    // 清除登录状态，跳转到登录页
    setTimeout(() => {
      userStore.clearAuth()
      window.location.href = '/login'
    }, 1500)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail?.message || e?.message || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}

onMounted(() => { loadProfile() })
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h1>个人中心</h1>
      <p>管理你的个人信息与账号安全</p>
    </div>

    <!-- 加载中 -->
    <el-skeleton v-if="pageLoading" :rows="8" animated />

    <template v-if="!pageLoading">
      <!-- ── 用户信息卡片 ── -->
      <div class="user-card card">
        <div class="user-card__main">
          <el-avatar :size="72" :icon="UserFilled" />
          <div class="user-card__info">
            <h2>{{ form.nickname || userStore.profile?.email || '未设置昵称' }}</h2>
            <p>{{ userStore.profile?.email || userStore.profile?.phone || '' }}</p>
            <div class="user-card__meta">
              <el-tag size="small" :type="isTeacher ? 'primary' : 'success'" effect="plain">
                {{ isTeacher ? '👨‍🏫 教师' : '🎒 学生' }}
              </el-tag>
              <el-tag v-if="form.grade" size="small" type="info" effect="plain">{{ form.grade }}</el-tag>
              <el-tag v-if="userStore.profile?.created_at" size="small" type="info" effect="plain">
                注册于 {{ new Date(userStore.profile.created_at).toLocaleDateString('zh-CN') }}
              </el-tag>
            </div>
            <p v-if="form.bio" class="user-card__bio">{{ form.bio }}</p>
          </div>
        </div>
      </div>

      <!-- ── Tab 切换 ── -->
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="个人资料" name="profile">
          <!-- 查看模式 -->
          <div v-if="!isEditing" class="detail-card card">
            <div class="detail-card__header">
              <h3>基本信息</h3>
              <el-button type="primary" plain @click="isEditing = true">编辑资料</el-button>
            </div>
            <div class="detail-row"><span class="label">昵称</span><span>{{ form.nickname || '未设置' }}</span></div>
            <div class="detail-row">
              <span class="label">{{ isTeacher ? '教学科目' : '学科偏好' }}</span>
              <span>
                <el-tag v-for="s in form.subjects" :key="s" size="small" class="tag-mr">{{ s }}</el-tag>
                <span v-if="form.subjects.length === 0" class="empty">未设置</span>
              </span>
            </div>
            <div class="detail-row"><span class="label">年级</span><span>{{ form.grade || '未设置' }}</span></div>
            <div class="detail-row"><span class="label">教材版本</span><span>{{ form.textbook_version || '未设置' }}</span></div>
            <div v-if="isTeacher" class="detail-row"><span class="label">所在学校</span><span>{{ form.school_name || '未设置' }}</span></div>
          </div>

          <!-- 编辑模式 -->
          <div v-if="isEditing" class="edit-card card">
            <h3>编辑个人资料</h3>
            <el-form label-position="top" size="large">
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="给自己起个名字" maxlength="20" show-word-limit />
              </el-form-item>

              <el-form-item :label="isTeacher ? '教学科目' : '学科偏好'">
                <div class="chip-grid">
                  <button
                    v-for="s in SUBJECT_OPTIONS" :key="s"
                    class="chip" :class="{ active: form.subjects.includes(s) }"
                    type="button" @click="toggleSubject(s)"
                  >{{ s }}</button>
                </div>
              </el-form-item>

              <el-form-item label="年级">
                <el-select v-model="form.grade" placeholder="选择年级" style="width:100%" clearable>
                  <el-option v-for="g in GRADE_OPTIONS" :key="g" :label="g" :value="g" />
                </el-select>
              </el-form-item>

              <el-form-item label="教材版本">
                <el-select v-model="form.textbook_version" placeholder="选择教材版本" style="width:100%" clearable>
                  <el-option v-for="v in TEXTBOOK_VERSIONS" :key="v" :label="v" :value="v" />
                </el-select>
              </el-form-item>

              <template v-if="isTeacher">
                <el-form-item label="所在学校">
                  <el-input v-model="form.school_name" placeholder="如：XX市第一中学" maxlength="64" show-word-limit />
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="简单介绍一下自己的教学经验..." maxlength="256" show-word-limit />
                </el-form-item>
              </template>

              <div class="form-actions">
                <el-button @click="handleCancel" size="large">取消</el-button>
                <el-button type="primary" :loading="editLoading" size="large" @click="handleSave">保存修改</el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- ── 账号安全 ── -->
        <el-tab-pane label="账号安全" name="password">
          <div class="password-card card">
            <h3>修改密码</h3>
            <p class="hint">建议定期更换密码，保护账号安全</p>
            <el-form label-position="top" size="large" style="max-width:420px">
              <el-form-item label="当前密码">
                <el-input v-model="pwdForm.oldPassword" type="password" placeholder="输入当前密码" show-password />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.newPassword" type="password" placeholder="新密码（至少 8 位）" show-password />
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.profile-page { max-width:720px; margin:0 auto; }

// ── 用户卡片 ──
.user-card {
  padding: var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
  &__main { display:flex; align-items:flex-start; gap:var(--spacing-xl); }
  &__info {
    flex:1;
    h2 { margin:0 0 4px; font-size:var(--font-size-h3); }
    p { margin:0 0 var(--spacing-sm); color:var(--color-text-secondary); font-size:var(--font-size-sm); }
  }
  &__meta { display:flex; gap:var(--spacing-xs); flex-wrap:wrap; margin-bottom:var(--spacing-sm); }
  &__bio { color:var(--color-text-secondary); font-size:var(--font-size-sm); font-style:italic; margin-top:var(--spacing-sm); }
  @media (max-width:480px){ &__main { flex-direction:column; align-items:center; text-align:center; } }
}

// ── 通用卡片 ──
.card { background:var(--color-bg-card); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); border:1px solid var(--color-border-light); }

// ── 详情卡片 ──
.detail-card {
  padding: var(--spacing-xl) var(--spacing-xxl);
  &__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--spacing-lg);
    h3 { margin:0; font-size:var(--font-size-base); }
  }
}
.detail-row { display:flex; align-items:flex-start; padding:var(--spacing-sm) 0; border-bottom:1px solid var(--color-border-light);
  .label { width:90px; flex-shrink:0; color:var(--color-text-secondary); font-size:var(--font-size-sm); line-height:28px; }
  &:last-child { border-bottom:none; }
}
.empty { color:var(--color-text-placeholder); font-style:italic; }
.tag-mr { margin-right:4px; margin-bottom:4px; }

// ── 编辑卡片 ──
.edit-card {
  padding: var(--spacing-xl) var(--spacing-xxl);
  h3 { margin:0 0 var(--spacing-lg); font-size:var(--font-size-base); }
}

// ── 密码卡片 ──
.password-card {
  padding: var(--spacing-xl) var(--spacing-xxl);
  h3 { margin:0 0 var(--spacing-xs); font-size:var(--font-size-base); }
  .hint { color:var(--color-text-secondary); font-size:var(--font-size-sm); margin:0 0 var(--spacing-lg); }
}

// ── Chip grid ──
.chip-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--spacing-sm);
  @media (max-width:480px){ grid-template-columns:repeat(3,1fr); }
}
.chip { padding:var(--spacing-sm) var(--spacing-md); border:1px solid var(--color-border); border-radius:var(--radius-md); background:var(--color-bg-card); cursor:pointer; font-size:var(--font-size-sm); transition:all var(--transition-fast);
  &.active { background:var(--color-primary-light); border-color:var(--color-primary); color:var(--color-primary); font-weight:var(--font-weight-medium); }
  &:hover:not(.active) { border-color:var(--color-primary); }
}

// ── 表单 ──
.form-actions { display:flex; justify-content:flex-end; gap:var(--spacing-base); padding-top:var(--spacing-lg); border-top:1px solid var(--color-border-light); }

// ── Tabs ──
.profile-tabs { margin-top:var(--spacing-base); }
</style>
