<script setup lang="ts">
/**
 * 创建班级弹窗
 */
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useClassStore } from '@/stores/class'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; created: [] }>()

const classStore = useClassStore()
const formRef = ref()
const submitting = ref(false)

const form = reactive({
  name: '',
  grade: '',
  subject: '',
  description: '',
})

const rules = {
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入学科', trigger: 'blur' }],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await classStore.createNewClass(form)
    ElMessage.success('班级创建成功')
    emit('update:visible', false)
    emit('created')
    form.name = ''
    form.grade = ''
    form.subject = ''
    form.description = ''
  } catch {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="创建班级"
    width="480px"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="班级名称" prop="name">
        <el-input v-model="form.name" placeholder="如：高一(3)班数学" maxlength="100" />
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
          <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三']" :key="g" :label="g" :value="g" />
        </el-select>
      </el-form-item>
      <el-form-item label="学科" prop="subject">
        <el-select v-model="form.subject" placeholder="请选择学科" style="width: 100%">
          <el-option v-for="s in ['语文','数学','英语','物理','化学','生物','历史','地理','政治']" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选，补充说明" maxlength="500" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>
