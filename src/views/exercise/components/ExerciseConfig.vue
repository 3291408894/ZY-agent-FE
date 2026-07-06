<script setup lang="ts">
// ================================================================
// ExerciseConfig — 出题配置面板
// 对应 PBI_08：智能习题生成 — 收集用户出题参数
// ================================================================

import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Difficulty, QuestionType } from '@/types'

// ── 常量 ──
const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级',
  '高一', '高二', '高三',
]

const DIFFICULTY_OPTIONS: Array<{ label: string; value: Difficulty }> = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]

const QUESTION_TYPE_OPTIONS: Array<{ label: string; value: QuestionType }> = [
  { label: '选择题', value: 'choice' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'short_answer' },
  { label: '计算题', value: 'calculation' },
  { label: '辨析题', value: 'analysis' },
]

// 快速预设
const PRESETS = [
  { label: '📖 文言文练习', config: { subject: '语文', knowledge_points: ['文言文阅读', '文言实词', '文言虚词'], question_types: ['choice', 'fill', 'short_answer'] as QuestionType[] } },
  { label: '🧮 数学计算', config: { subject: '数学', knowledge_points: ['四则运算', '代数'], question_types: ['calculation', 'fill'] as QuestionType[] } },
  { label: '📝 英语语法', config: { subject: '英语', knowledge_points: ['语法', '时态', '词汇'], question_types: ['choice', 'fill'] as QuestionType[] } },
]

// ── Emits ──
const emit = defineEmits<{
  (e: 'generate', config: {
    subject: string
    grade: string
    knowledge_points: string[]
    difficulty: Difficulty
    question_types: QuestionType[]
    count: number
    mode: string
  }): void
}>()

// ── 表单数据 ──
const formRef = ref<FormInstance>()
const form = reactive({
  subject: '',
  grade: '',
  knowledge_points: [] as string[],
  difficulty: 'medium' as Difficulty,
  question_types: ['choice'] as QuestionType[],
  count: 5,
  mode: 'practice' as string,
})

// 校验规则
const rules: FormRules = {
  subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  knowledge_points: [
    { type: 'array', required: true, min: 1, message: '请至少添加一个知识点', trigger: 'change' },
  ],
  question_types: [
    { type: 'array', required: true, min: 1, message: '请至少选择一种题型', trigger: 'change' },
  ],
}

// ── 快速填充预设 ──
function applyPreset(preset: (typeof PRESETS)[number]) {
  form.subject = preset.config.subject
  form.knowledge_points = [...preset.config.knowledge_points]
  form.question_types = [...preset.config.question_types]
}

// ── 提交 ──
async function handleGenerate() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  emit('generate', {
    subject: form.subject,
    grade: form.grade,
    knowledge_points: [...form.knowledge_points],
    difficulty: form.difficulty,
    question_types: [...form.question_types],
    count: form.count,
    mode: form.mode,
  })
}
</script>

<template>
  <div class="config-panel">
    <!-- 快速预设 -->
    <div class="config-panel__presets">
      <span class="config-panel__presets-label">快速开始：</span>
      <el-button
        v-for="preset in PRESETS"
        :key="preset.label"
        size="small"
        round
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </el-button>
    </div>

    <!-- 配置表单 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="config-panel__form"
    >
      <div class="config-panel__row">
        <el-form-item label="学科" prop="subject" class="config-panel__half">
          <el-select v-model="form.subject" placeholder="选择学科" clearable>
            <el-option
              v-for="s in SUBJECTS"
              :key="s"
              :label="s"
              :value="s"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="年级" prop="grade" class="config-panel__half">
          <el-select v-model="form.grade" placeholder="选择年级" clearable>
            <el-option
              v-for="g in GRADES"
              :key="g"
              :label="g"
              :value="g"
            />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="知识点" prop="knowledge_points">
        <el-select
          v-model="form.knowledge_points"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入或选择知识点（支持自定义）"
          :reserve-keyword="false"
        >
          <el-option
            v-for="kp in form.knowledge_points"
            :key="kp"
            :label="kp"
            :value="kp"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="难度">
        <el-radio-group v-model="form.difficulty">
          <el-radio-button
            v-for="d in DIFFICULTY_OPTIONS"
            :key="d.value"
            :value="d.value"
          >
            {{ d.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="题型" prop="question_types">
        <el-checkbox-group v-model="form.question_types">
          <el-checkbox
            v-for="qt in QUESTION_TYPE_OPTIONS"
            :key="qt.value"
            :value="qt.value"
          >
            {{ qt.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="出题模式">
        <el-radio-group v-model="form.mode">
          <el-radio-button value="practice">✏️ 做题模式（隐藏答案）</el-radio-button>
          <el-radio-button value="review">📖 解析模式（显示答案）</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="题目数量">
        <el-input-number
          v-model="form.count"
          :min="1"
          :max="50"
          :step="1"
          step-strictly
        />
        <span class="config-panel__hint">（1-50 道）</span>
      </el-form-item>
    </el-form>

    <!-- 生成按钮 -->
    <el-button
      type="primary"
      size="large"
      class="config-panel__submit"
      @click="handleGenerate"
    >
      ✨ 生成习题
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.config-panel {
  max-width: 640px;
  margin: 0 auto;

  &__presets {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-base);
    background: var(--color-primary-lighter);
    border-radius: var(--radius-md);
  }

  &__presets-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__form {
    margin-bottom: var(--spacing-xl);
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-base);
  }

  &__half {
    // grid handles width
  }

  &__hint {
    margin-left: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }

  &__submit {
    width: 100%;
  }
}

// 平板及以下改为单列
@media (max-width: 640px) {
  .config-panel__row {
    grid-template-columns: 1fr;
  }
}
</style>
