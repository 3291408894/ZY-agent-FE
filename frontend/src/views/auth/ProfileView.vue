<script setup lang="ts">
// ================================================================
// ProfileView — 个人资料页面
// 对应 PBI_01：获取/更新用户资料
// 与 认证模块接口说明书.md §4.1、§4.2 对齐
// ================================================================

import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getProfile, updateProfile } from '@/api/modules/auth'

const userStore = useUserStore()

// ── 可选年级 ──
const grades = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级', '高一', '高二', '高三',
]

// ── 可选学科 ──
const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

// ── 表单状态 ──
const formRef = ref<FormInstance>()
const form = reactive({
  nickname: '',
  grade: '',
  subjects: [] as string[],
  textbook_version: '',
})

const textbookVersions = ['部编版', '人教版', '北师大版', '苏教版', '沪教版', '鲁教版', '浙教版', '其他']

const loading = ref(false)
const pageLoading = ref(true)
const isEditing = ref(false)
const errorMessage = ref('')

// ── 表单校验 ──
const rules: FormRules = {
  nickname: [
    { max: 20, message: '昵称不能超过 20 个字符', trigger: 'blur' },
  ],
}

// ── 加载资料 ──
async function loadProfile() {
  pageLoading.value = true
  try {
    const data = await getProfile()
    form.nickname = data.nickname || ''
    form.grade = data.grade || ''
    form.subjects = data.subjects || []
    form.textbook_version = data.textbook_version || ''
    userStore.setProfile(data)
  } catch (e: any) {
    // Token 过期由拦截器统一处理，这里只提示其他错误
    if (!e?.message?.includes('登录已过期')) {
      errorMessage.value = e?.message || '加载资料失败'
    }
  } finally {
    pageLoading.value = false
  }
}

// ── 切换学科 ──
function toggleSubject(subject: string) {
  const idx = form.subjects.indexOf(subject)
  if (idx >= 0) {
    if (form.subjects.length > 1) {
      form.subjects.splice(idx, 1)
    } else {
      ElMessage.warning('至少选择一门学科')
    }
  } else {
    form.subjects.push(subject)
  }
}

// ── 保存 ──
async function handleSave() {
  errorMessage.value = ''

  if (form.subjects.length === 0) {
    ElMessage.warning('请至少选择一门学科')
    return
  }

  loading.value = true
  try {
    const updated = await updateProfile({
      nickname: form.nickname.trim() || undefined,
      grade: form.grade || undefined,
      subjects: form.subjects.length > 0 ? form.subjects : undefined,
      textbook_version: form.textbook_version || undefined,
    })
    userStore.setProfile(updated)
    ElMessage.success('个人资料已更新')
    isEditing.value = false
  } catch (e: any) {
    errorMessage.value = e?.message || '更新失败，请重试'
  } finally {
    loading.value = false
  }
}

// ── 取消编辑 ──
function handleCancel() {
  isEditing.value = false
  errorMessage.value = ''
  loadProfile() // 重新加载恢复原值
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-header__title">个人资料</h1>
      <p class="page-header__subtitle">管理你的个人信息和学习偏好</p>
    </div>

    <!-- 加载中 -->
    <div v-if="pageLoading" class="profile-page__loading">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMessage && !pageLoading"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="true"
      class="profile-page__error"
      @close="errorMessage = ''"
    />

    <!-- 资料卡片 -->
    <div v-if="!pageLoading" class="profile-card card">
      <!-- 头像区域 -->
      <div class="profile-card__avatar-section">
        <el-avatar :size="80" :icon="UserFilled" class="profile-card__avatar" />
        <div class="profile-card__info">
          <h3>{{ form.nickname || userStore.profile?.nickname || '未设置昵称' }}</h3>
          <p>{{ userStore.profile?.email || userStore.profile?.phone || '' }}</p>
        </div>
        <el-button
          v-if="!isEditing"
          type="primary"
          plain
          @click="isEditing = true"
        >
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
      </div>

      <!-- 查看模式 -->
      <div v-if="!isEditing" class="profile-card__details">
        <div class="detail-row">
          <span class="detail-row__label">年级</span>
          <span class="detail-row__value">{{ form.grade || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row__label">学科偏好</span>
          <span class="detail-row__value">
            <el-tag
              v-for="s in form.subjects"
              :key="s"
              size="small"
              class="subject-tag"
            >
              {{ s }}
            </el-tag>
            <span v-if="form.subjects.length === 0" class="detail-row__empty">未设置</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-row__label">教材版本</span>
          <span class="detail-row__value">{{ form.textbook_version || '未设置' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row__label">注册时间</span>
          <span class="detail-row__value">
            {{ userStore.profile?.created_at ? new Date(userStore.profile.created_at).toLocaleDateString('zh-CN') : '-' }}
          </span>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-if="isEditing" class="profile-card__form">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="输入昵称（最多 20 字）" maxlength="20" size="large" />
          </el-form-item>

          <el-form-item label="年级" prop="grade">
            <el-select v-model="form.grade" placeholder="选择你的年级" size="large" style="width: 100%">
              <el-option
                v-for="g in grades"
                :key="g"
                :label="g"
                :value="g"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="学科偏好" prop="subjects">
            <div class="subject-grid">
              <button
                v-for="s in allSubjects"
                :key="s"
                class="subject-chip"
                :class="{ 'is-selected': form.subjects.includes(s) }"
                type="button"
                @click="toggleSubject(s)"
              >
                {{ s }}
              </button>
            </div>
          </el-form-item>

          <el-form-item label="教材版本" prop="textbook_version">
            <el-select v-model="form.textbook_version" placeholder="选择教材版本（可选）" size="large" style="width: 100%" clearable>
              <el-option
                v-for="v in textbookVersions"
                :key="v"
                :label="v"
                :value="v"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="profile-card__form-actions">
          <el-button size="large" @click="handleCancel">取消</el-button>
          <el-button type="primary" size="large" :loading="loading" @click="handleSave">
            {{ loading ? '保存中...' : '保存修改' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 640px;
  margin: 0 auto;

  &__loading {
    margin-top: var(--spacing-xl);
  }

  &__error {
    margin-bottom: var(--spacing-lg);
  }
}

// ── 资料卡片 ──
.profile-card {
  padding: var(--spacing-xxl);

  &__avatar-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xxl);
    padding-bottom: var(--spacing-xxl);
    border-bottom: 1px solid var(--color-border-light);
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__info {
    flex: 1;

    h3 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--spacing-xs);
    }

    p {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  &__form {
    &-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-base);
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--color-border-light);
    }
  }
}

// ── 详情行 ──
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);

  &__label {
    width: 80px;
    flex-shrink: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: 32px;
  }

  &__value {
    flex: 1;
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    line-height: 32px;
  }

  &__empty {
    color: var(--color-text-placeholder);
    font-style: italic;
  }
}

.subject-tag {
  margin-right: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

// ── 学科选择 ──
.subject-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.subject-chip {
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

// ── 响应式 ──
@media (max-width: 480px) {
  .profile-card__avatar-section {
    flex-direction: column;
    text-align: center;
  }
}
</style>
