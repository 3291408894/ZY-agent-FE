<script setup lang="ts">
/** 试卷配置表单 */

import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { IExamPaperGenerateRequest, ExamType, IQuestionTypeConfig } from '@/types'
import { EXAM_TYPE_LABELS } from '@/types'
import { getResourceSelectList } from '@/api/modules/teachingResource'
import QuestionStructureEditor from './QuestionStructureEditor.vue'
import DifficultySlider from './DifficultySlider.vue'

const emit = defineEmits<{
  generate: [config: IExamPaperGenerateRequest]
}>()

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']

// ── 教学资源库列表 ──
interface ResourceOption { id: string; title: string; subject: string; grade: string; resource_type: string }
const resources = ref<ResourceOption[]>([])
const resourceLoading = ref(false)
const selectedResourceId = ref<string | null>(null)

async function loadResources() {
  resourceLoading.value = true
  try {
    const res = await getResourceSelectList()
    const data = res?.items ?? res?.data?.items ?? []
    resources.value = Array.isArray(data) ? data : []
  } catch { resources.value = [] }
  finally { resourceLoading.value = false }
}

onMounted(() => { loadResources() })

const form = ref({
  title: '',
  subject: '数学',
  grade: '高一',
  exam_type: 'unit_test' as ExamType,
  total_score: 100,
  focus_instruction: '',
})

const difficultyRatio = ref({ easy: 30, medium: 50, hard: 20 })
const questionStructure = ref<IQuestionTypeConfig[]>([
  { type: '选择题', count: 8, score_per: 5, subtotal: 40 },
  { type: '填空题', count: 4, score_per: 5, subtotal: 20 },
  { type: '解答题', count: 4, score_per: 10, subtotal: 40 },
])

const structSubtotal = computed(() => questionStructure.value.reduce((s, q) => s + q.subtotal, 0))
const canGenerate = computed(() => {
  if (!form.value.title.trim()) return false
  if (structSubtotal.value !== form.value.total_score) return false
  const diffSum = difficultyRatio.value.easy + difficultyRatio.value.medium + difficultyRatio.value.hard
  if (diffSum !== 100) return false
  if (questionStructure.value.some((q) => !q.type.trim())) return false
  return true
})

function handleGenerate() {
  if (!canGenerate.value) {
    ElMessage.warning('请完善试卷配置，确保题型小计=总分，难度配比=100%')
    return
  }
  emit('generate', {
    ...form.value,
    difficulty_ratio: { ...difficultyRatio.value },
    question_structure: [...questionStructure.value],
    resource_id: selectedResourceId.value || undefined,
  })
}

// 快速预设：总分变化时自动调整题型
function onTotalScoreChange(val: number) {
  form.value.total_score = val
  // 简单等比例调整
}
</script>

<template>
  <div class="exam-config">
    <h2 class="exam-config__title">试卷配置</h2>

    <el-form label-width="90px" label-position="left">
      <!-- 基本信息 -->
      <el-form-item label="试卷标题" required>
        <el-input
          v-model="form.title"
          placeholder="如：高一数学期中考试"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="学科">
            <el-select v-model="form.subject" style="width: 100%">
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年级">
            <el-select v-model="form.grade" style="width: 100%">
              <el-option v-for="g in grades" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="考试类型">
            <el-select v-model="form.exam_type" style="width: 100%">
              <el-option
                v-for="(label, key) in EXAM_TYPE_LABELS"
                :key="key"
                :label="label"
                :value="key"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="总分">
        <el-input-number
          :model-value="form.total_score"
          :min="10"
          :max="300"
          :step="10"
          @update:model-value="onTotalScoreChange($event as number)"
        />
        <span style="margin-left: 8px; color: var(--color-text-secondary); font-size: 13px">
          题型小计：{{ structSubtotal }} / {{ form.total_score }} 分
          <template v-if="structSubtotal !== form.total_score">
            <el-tag type="danger" size="small">不一致</el-tag>
          </template>
        </span>
      </el-form-item>

      <!-- 题型分布编辑器 -->
      <el-form-item label="题型分布">
        <QuestionStructureEditor
          v-model="questionStructure"
          :total-score="form.total_score"
        />
      </el-form-item>

      <!-- 难度配比 -->
      <el-form-item label="难度配比">
        <DifficultySlider v-model="difficultyRatio" />
      </el-form-item>

      <!-- 参考教学资源 -->
      <el-form-item label="参考资源">
        <el-select
          v-model="selectedResourceId"
          placeholder="选择教学资源库文件作为出题参考..."
          clearable
          filterable
          size="large"
          style="width:100%"
          :loading="resourceLoading"
        >
          <el-option
            v-for="r in resources"
            :key="r.id"
            :label="`[${r.subject || '无学科'}] ${r.title}`"
            :value="r.id"
          >
            <div class="exam-resource-option">
              <span class="exam-resource-option__title">{{ r.title }}</span>
              <span class="exam-resource-option__meta">{{ r.subject }} · {{ r.grade }} · {{ ({ courseware: '课件', exam_paper: '试卷', lesson_plan: '教案', other: '其他' })[r.resource_type] || r.resource_type }}</span>
            </div>
          </el-option>
        </el-select>
        <div style="margin-top:4px;font-size:12px;color:var(--color-text-placeholder)">可选：选取资源库文件，AI 命题时将参考文件内容</div>
      </el-form-item>

      <!-- 补充说明 -->
      <el-form-item label="重点考点">
        <el-input
          v-model="form.focus_instruction"
          type="textarea"
          :rows="2"
          placeholder="选填：重点考点、知识点范围等补充说明"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          size="large"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          <el-icon><component :is="'MagicStick'" /></el-icon>
          AI 生成试卷
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.exam-config {
  max-width: 780px;
  margin: 0 auto;

  &__title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--color-text-primary);
  }
}

.exam-resource-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  &__title { font-size: var(--font-size-sm); color: var(--color-text-primary); }
  &__meta { font-size: var(--font-size-xs); color: var(--color-text-placeholder); }
}
</style>
