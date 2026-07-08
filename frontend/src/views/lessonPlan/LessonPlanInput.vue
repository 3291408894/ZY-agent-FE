<script setup lang="ts">
/**
 * 智能教案生成 — 表单输入与流式生成 (PBI_LP)
 */
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useSSE } from '@/composables/useSSE'
import { getLessonPlanGenerateUrl } from '@/api/modules/lessonPlan'
import { useLessonPlanStore } from '@/stores/lessonPlan'
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '@/types'
import LessonPlanResult from './LessonPlanResult.vue'

const emit = defineEmits<{
  generated: []
}>()

const store = useLessonPlanStore()
const { connect, disconnect } = useSSE()

// ── 表单状态 ──
const formRef = ref()
const form = reactive({
  subject: '',
  grade: '',
  textbook_version: '',
  unit_chapter: '',
  class_hours: 1,
  teaching_objectives: '',
  requirements: '',
})

const rules = {
  subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  teaching_objectives: [
    { required: true, message: '请输入教学目标', trigger: 'blur' },
    { min: 5, message: '教学目标至少5个字符', trigger: 'blur' },
    { max: 2000, message: '教学目标不超过2000个字符', trigger: 'blur' },
  ],
}

const generating = ref(false)
const showResult = ref(false)

// ── 开始生成 ──
async function handleGenerate() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  store.resetCurrent()
  generating.value = true
  showResult.value = true
  store.isStreaming = true

  const url = getLessonPlanGenerateUrl()
  await connect(url, {
    subject: form.subject,
    grade: form.grade,
    textbook_version: form.textbook_version,
    unit_chapter: form.unit_chapter,
    class_hours: form.class_hours,
    teaching_objectives: form.teaching_objectives,
    requirements: form.requirements || undefined,
  }, {
    onContent(chunk: string) {
      store.appendContent(chunk)
    },
    onDone(data: { lesson_plan_id?: string; title?: string }) {
      store.setDone(data.lesson_plan_id || '', data.title || '')
      ElMessage.success('教案生成完成！')
      emit('generated')
    },
    onError(msg: string) {
      store.setStreamError(msg)
      ElMessage.error(msg || '生成失败')
    },
  })

  generating.value = false
}

// ── 取消生成 ──
function handleCancel() {
  disconnect()
  generating.value = false
  store.isStreaming = false
}

// ── 重新生成 ──
function handleRegenerate() {
  showResult.value = false
  store.resetCurrent()
}
</script>

<template>
  <div class="lp-input">
    <!-- 表单 -->
    <div v-if="!showResult" class="lp-input__form">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学科" prop="subject">
              <el-select
                v-model="form.subject"
                placeholder="请选择学科"
                filterable
                allow-create
                clearable
              >
                <el-option
                  v-for="s in SUBJECT_OPTIONS"
                  :key="s"
                  :label="s"
                  :value="s"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级" prop="grade">
              <el-select
                v-model="form.grade"
                placeholder="请选择年级"
                filterable
                allow-create
                clearable
              >
                <el-option
                  v-for="g in GRADE_OPTIONS"
                  :key="g"
                  :label="g"
                  :value="g"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="教材版本">
              <el-input
                v-model="form.textbook_version"
                placeholder="如：部编版、人教版"
                maxlength="64"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单元/章节">
              <el-input
                v-model="form.unit_chapter"
                placeholder="如：第三单元 第九课《古诗三首》"
                maxlength="128"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="课时数">
          <el-input-number
            v-model="form.class_hours"
            :min="1"
            :max="10"
            :step="1"
          />
          <span class="lp-input__hint">建议 1-3 课时</span>
        </el-form-item>

        <el-form-item label="教学目标" prop="teaching_objectives">
          <el-input
            v-model="form.teaching_objectives"
            type="textarea"
            :rows="4"
            placeholder="请描述本课的教学目标，例如：理解古诗意境，掌握生字词，能背诵默写..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="特殊要求（可选）">
          <el-input
            v-model="form.requirements"
            type="textarea"
            :rows="2"
            placeholder="如有特殊教学要求或注意事项，请在此说明..."
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="generating"
            size="large"
            @click="handleGenerate"
          >
            {{ generating ? '正在生成...' : '🚀 开始生成教案' }}
          </el-button>
          <el-button
            v-if="generating"
            type="danger"
            size="large"
            @click="handleCancel"
          >
            取消生成
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 结果展示 -->
    <div v-else class="lp-input__result">
      <LessonPlanResult
        @back="handleRegenerate"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lp-input {
  &__form {
    padding: var(--spacing-lg);
    background: var(--color-bg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
  }

  &__hint {
    margin-left: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }

  &__result {
    // 结果区域占满宽度
  }
}
</style>
