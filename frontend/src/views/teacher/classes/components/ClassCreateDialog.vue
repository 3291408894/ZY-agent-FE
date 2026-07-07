<script setup lang="ts">
// ================================================================
// ClassCreateDialog — 创建班级弹窗
// ================================================================

import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createClass } from '@/api/modules/class'
import { useClassStore } from '@/stores/class'
import type { IClassCreateRequest } from '@/types'

const emit = defineEmits<{
  success: [classId: string]
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<IClassCreateRequest>({
  name: '',
  grade: '',
  subject: '',
  description: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 1, max: 100, message: '班级名称长度在 1 到 100 个字符', trigger: 'blur' },
  ],
  grade: [
    { required: true, message: '请输入年级', trigger: 'blur' },
    { min: 1, max: 50, message: '年级长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  subject: [
    { required: true, message: '请输入学科', trigger: 'blur' },
    { min: 1, max: 50, message: '学科长度在 1 到 50 个字符', trigger: 'blur' },
  ],
}

const gradeOptions = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三',
]

const subjectOptions = [
  '语文', '数学', '英语', '物理', '化学', '生物',
  '历史', '地理', '政治', '信息技术', '体育', '美术', '音乐',
]

const classStore = useClassStore()

function open() {
  form.name = ''
  form.grade = ''
  form.subject = ''
  form.description = ''
  visible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data = await createClass({
      name: form.name,
      grade: form.grade,
      subject: form.subject,
      description: form.description || undefined,
    })
    classStore.addToTeacherList(data)
    ElMessage.success('班级创建成功')
    visible.value = false
    emit('success', data.id)
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    title="创建班级"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="班级名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="例如：高一(3)班数学"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="年级" prop="grade">
            <el-select
              v-model="form.grade"
              placeholder="请选择年级"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="g in gradeOptions"
                :key="g"
                :label="g"
                :value="g"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学科" prop="subject">
            <el-select
              v-model="form.subject"
              placeholder="请选择学科"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="s in subjectOptions"
                :key="s"
                :label="s"
                :value="s"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="班级描述（选填）" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="例如：2026年秋季学期"
          maxlength="500"
          show-word-limit
          :rows="3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false" :disabled="loading">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        创建班级
      </el-button>
    </template>
  </el-dialog>
</template>
