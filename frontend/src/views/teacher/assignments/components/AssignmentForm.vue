<script setup lang="ts">
/**
 * 教师端 — 作业布置表单
 */
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useAssignmentStore } from '@/stores/assignment'
import { useClassStore } from '@/stores/class'
import type { IAssignmentSection, IAssignmentQuestion } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean]; created: [] }>()

const assignmentStore = useAssignmentStore()
const classStore = useClassStore()

const formRef = ref()
const submitting = ref(false)

const form = reactive({
  class_id: '',
  title: '',
  subject: '',
  description: '',
  total_score: null as number | null,
  due_date: '',
  allow_late_submission: false,
})

const sections = ref<IAssignmentSection[]>([
  {
    type: 'objective',
    title: '一、选择题',
    questions: [
      { number: 1, stem: '', options: ['A. ', 'B. ', 'C. ', 'D. '], answer: '', score: 5 },
    ],
  },
])

const rules = {
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入学科', trigger: 'blur' }],
  due_date: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
}

// 加载班级列表
classStore.fetchTeacherClasses()

function addSection(type: 'objective' | 'subjective') {
  const n = sections.value.length + 1
  const label = type === 'objective' ? '选择题' : '解答题'
  sections.value.push({
    type,
    title: `${n}、${label}`,
    questions: [{ number: sections.value.reduce((sum, s) => sum + s.questions.length, 0) + 1, stem: '', options: type === 'objective' ? ['A. ', 'B. ', 'C. ', 'D. '] : [], answer: '', score: type === 'objective' ? 5 : 10 }],
  })
}

function addQuestion(sectionIndex: number) {
  const section = sections.value[sectionIndex]
  const totalQuestions = sections.value.reduce((sum, s, i) => {
    if (i < sectionIndex) return sum + s.questions.length
    return sum
  }, 0)
  section.questions.push({
    number: totalQuestions + section.questions.length + 1,
    stem: '',
    options: section.type === 'objective' ? ['A. ', 'B. ', 'C. ', 'D. '] : [],
    answer: '',
    score: section.type === 'objective' ? 5 : 10,
  })
}

function removeSection(index: number) {
  sections.value.splice(index, 1)
  renumberQuestions()
}

function removeQuestion(si: number, qi: number) {
  sections.value[si].questions.splice(qi, 1)
  if (sections.value[si].questions.length === 0) {
    sections.value.splice(si, 1)
  }
  renumberQuestions()
}

function renumberQuestions() {
  let n = 1
  for (const s of sections.value) {
    for (const q of s.questions) {
      q.number = n++
    }
  }
}

function computeTotal() {
  let total = 0
  for (const s of sections.value) {
    for (const q of s.questions) {
      total += q.score || 0
    }
  }
  form.total_score = total
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  computeTotal()

  submitting.value = true
  try {
    await assignmentStore.createNewAssignment({
      class_id: form.class_id,
      title: form.title,
      subject: form.subject,
      description: form.description || null,
      content: { format: 'mixed', sections: sections.value },
      total_score: form.total_score,
      due_date: new Date(form.due_date).toISOString(),
      allow_late_submission: form.allow_late_submission,
    })
    ElMessage.success('作业布置成功')
    emit('update:visible', false)
    emit('created')
  } catch {
    ElMessage.error('布置失败')
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
    title="布置作业"
    width="800px"
    top="5vh"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="选择班级" prop="class_id">
            <el-select v-model="form.class_id" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="c in classStore.activeClasses"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学科" prop="subject">
            <el-select v-model="form.subject" placeholder="请选择" style="width: 100%">
              <el-option v-for="s in ['语文','数学','英语','物理','化学','生物','历史','地理','政治']" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="作业标题" prop="title">
        <el-input v-model="form.title" placeholder="如：第三单元综合练习" maxlength="200" />
      </el-form-item>
      <el-form-item label="作业说明">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="截止时间" prop="due_date">
            <el-date-picker v-model="form.due_date" type="datetime" placeholder="选择截止时间" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="允许迟交">
            <el-switch v-model="form.allow_late_submission" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 题目编辑区 -->
    <div class="questions-editor">
      <div class="q-header">
        <h4>题目设置</h4>
        <div class="q-actions">
          <el-button size="small" @click="addSection('objective')">+ 选择题区</el-button>
          <el-button size="small" @click="addSection('subjective')">+ 解答题区</el-button>
        </div>
      </div>

      <div v-for="(section, si) in sections" :key="si" class="section-editor">
        <div class="section-header">
          <el-input v-model="section.title" size="small" style="width: 200px" />
          <el-tag size="small" :type="section.type === 'objective' ? 'info' : 'warning'">
            {{ section.type === 'objective' ? '客观题' : '主观题' }}
          </el-tag>
          <el-button text type="danger" size="small" @click="removeSection(si)">删除分区</el-button>
        </div>
        <div v-for="(q, qi) in section.questions" :key="qi" class="question-editor">
          <div class="q-row">
            <span class="q-num">{{ q.number }}.</span>
            <el-input v-model="q.stem" size="small" placeholder="题目内容" style="flex: 1" />
            <el-input v-model="q.answer" size="small" placeholder="答案" style="width: 120px" />
            <el-input-number v-model="q.score" size="small" :min="1" style="width: 80px" />
            <el-button text type="danger" size="small" @click="removeQuestion(si, qi)">×</el-button>
          </div>
          <div v-if="section.type === 'objective'" class="q-options">
            <el-input
              v-for="(opt, oi) in q.options"
              :key="oi"
              v-model="q.options[oi]"
              size="small"
              :placeholder="`选项 ${String.fromCharCode(65 + oi)}`"
              style="width: 180px; margin-right: 8px"
            />
          </div>
        </div>
        <el-button size="small" text type="primary" @click="addQuestion(si)">+ 添加题目</el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        发布作业（总分：{{ form.total_score ?? '—' }}分）
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.questions-editor {
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
}
.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  h4 { margin: 0; }
  .q-actions { display: flex; gap: 8px; }
}
.section-editor {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.question-editor {
  padding: 8px;
  margin-bottom: 6px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}
.q-row {
  display: flex;
  align-items: center;
  gap: 6px;
  .q-num { font-weight: bold; min-width: 28px; }
}
.q-options {
  margin-top: 6px;
  padding-left: 34px;
}
</style>
