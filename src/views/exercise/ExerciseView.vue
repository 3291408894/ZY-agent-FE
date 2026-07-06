<script setup lang="ts">
// ================================================================
// ExerciseView — 习题练习主页面（状态机驱动）
// 对应 PBI_08/09/10：智能习题生成 + 双模式 + 实时批改
// ================================================================

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSSE } from '@/composables/useSSE'
import { submitAnswers, buildGenerateRequest } from '@/api/modules/exercise'
import type { IGenerateExerciseParams } from '@/api/modules/exercise'
import type { IExercise, IGradeResult } from '@/types'
import ExerciseConfig from './components/ExerciseConfig.vue'
import ExerciseList from './components/ExerciseList.vue'
import GradeResult from './components/GradeResult.vue'
import ExerciseHistory from './components/ExerciseHistory.vue'

// ================================================================
// 状态机
// ================================================================
type PageState = 'config' | 'generating' | 'exercises' | 'grading' | 'graded' | 'history'

const pageState = ref<PageState>('config')

// ================================================================
// 数据宿主
// ================================================================
const exercises = ref<IExercise[]>([])
const batchId = ref('')
const gradeResult = ref<IGradeResult | null>(null)
const generateProgress = ref({ generated: 0, total: 0 })

// ================================================================
// SSE 生成习题
// ================================================================
const { isStreaming, error: sseError, connect, disconnect } = useSSE()

async function handleGenerate(config: IGenerateExerciseParams) {
  pageState.value = 'generating'
  exercises.value = []
  generateProgress.value = { generated: 0, total: config.count }

  const { url, body } = buildGenerateRequest(config)

  await connect({
    url,
    body,
    onProgress(data) {
      generateProgress.value = {
        generated: data.generated || 0,
        total: data.total || config.count,
      }
    },
    onExercise(data) {
      // 逐题追加：每生成一道题就展示出来
      if (data.exercise) {
        exercises.value.push(data.exercise as IExercise)
      }
    },
    onDone(data) {
      // 生成完成：确认最终数据
      if (data.exercises?.length) {
        exercises.value = data.exercises as IExercise[]
      }
      batchId.value = data.batch_id || ''
      pageState.value = 'exercises'
    },
    onError(err) {
      ElMessage.error('习题生成失败：' + err)
      if (exercises.value.length > 0) {
        // 如果已经有部分生成成功，仍可继续使用
        pageState.value = 'exercises'
      } else {
        pageState.value = 'config'
      }
    },
  })
}

// ================================================================
// 提交批改
// ================================================================
async function handleSubmit(answers: Array<{ exercise_id: string; user_answer: string }>) {
  pageState.value = 'grading'

  try {
    const result = await submitAnswers({
      batch_id: batchId.value,
      answers,
    })
    gradeResult.value = result
    pageState.value = 'graded'
  } catch (e: any) {
    ElMessage.error(e?.message || '批改失败，请重试')
    pageState.value = 'exercises'
  }
}

// ================================================================
// 导航切换
// ================================================================
function handleBackToConfig() {
  pageState.value = 'config'
  exercises.value = []
  gradeResult.value = null
  batchId.value = ''
}

function handleRetry() {
  handleBackToConfig()
}

function handleViewHistory() {
  pageState.value = 'history'
}

function handleViewDetail(batchId: string) {
  // 切换到 graded 状态展示历史详情
  // 数据由 ExerciseHistory emit 携带的 batchId 查询
  // 这里简化处理，直接切换（实际 ExerciseHistory 的 click 事件在父级处理）
  pageState.value = 'graded'
}

function handleBackFromHistory() {
  pageState.value = 'config'
}
</script>

<template>
  <div class="exercise-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">习题练习</h1>
        <p class="page-header__subtitle">智能生成习题，支持做题/解析双模式，自动批改反馈</p>
      </div>
      <el-button
        v-if="pageState !== 'history'"
        @click="handleViewHistory"
      >
        📋 练习记录
      </el-button>
      <el-button
        v-if="pageState === 'history'"
        type="primary"
        @click="handleBackFromHistory"
      >
        ✨ 开始出题
      </el-button>
    </div>

    <!-- ================================ -->
    <!-- 状态：出题配置                      -->
    <!-- ================================ -->
    <div v-if="pageState === 'config'" class="card">
      <ExerciseConfig @generate="handleGenerate" />
    </div>

    <!-- ================================ -->
    <!-- 状态：正在生成                      -->
    <!-- ================================ -->
    <div v-else-if="pageState === 'generating'" class="card">
      <div class="generating-state">
        <div class="generating-state__icon">✨</div>
        <h2>AI 正在为你生成习题...</h2>
        <el-progress
          :percentage="generateProgress.total > 0
            ? Math.round((generateProgress.generated / generateProgress.total) * 100)
            : 0"
          :stroke-width="12"
          :show-text="true"
          style="max-width: 400px; margin: var(--spacing-xl) auto 0;"
        />
        <p class="generating-state__status">
          已生成 {{ generateProgress.generated }} / {{ generateProgress.total }} 道
        </p>

        <!-- 逐题预览 -->
        <div v-if="exercises.length > 0" class="generating-state__preview">
          <div
            v-for="(ex, idx) in exercises"
            :key="ex.id"
            class="card preview-card"
          >
            <span class="preview-card__index">第 {{ idx + 1 }} 题</span>
            <span class="preview-card__text">{{ ex.question?.substring(0, 60) }}{{ ex.question?.length > 60 ? '...' : '' }}</span>
          </div>
        </div>

        <el-button
          type="danger"
          size="small"
          style="margin-top: var(--spacing-xl)"
          @click="disconnect"
        >
          取消生成
        </el-button>
      </div>
    </div>

    <!-- ================================ -->
    <!-- 状态：做题 / 解析                  -->
    <!-- ================================ -->
    <div v-else-if="pageState === 'exercises'">
      <ExerciseList
        :exercises="exercises"
        :batch-id="batchId"
        :grade-result="gradeResult"
        @submit="handleSubmit"
        @back-to-config="handleBackToConfig"
      />
    </div>

    <!-- ================================ -->
    <!-- 状态：正在批改                      -->
    <!-- ================================ -->
    <div v-else-if="pageState === 'grading'" class="card">
      <div class="generating-state">
        <div class="generating-state__icon">🔍</div>
        <h2>正在批改...</h2>
        <p style="color: var(--color-text-secondary); margin-top: var(--spacing-sm);">
          AI 正在仔细批改你的答案，请稍候
        </p>
        <el-progress
          :percentage="100"
          :indeterminate="true"
          :stroke-width="8"
          style="max-width: 300px; margin: var(--spacing-xl) auto 0;"
        />
      </div>
    </div>

    <!-- ================================ -->
    <!-- 状态：批改完成                      -->
    <!-- ================================ -->
    <div v-else-if="pageState === 'graded' && gradeResult">
      <GradeResult
        :grade-result="gradeResult"
        :exercises="exercises"
        @retry="handleRetry"
        @view-history="handleViewHistory"
      />
    </div>

    <!-- ================================ -->
    <!-- 状态：历史记录                      -->
    <!-- ================================ -->
    <div v-else-if="pageState === 'history'">
      <ExerciseHistory
        @view-detail="handleViewDetail"
        @back="handleBackFromHistory"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exercise-page {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--page-padding);
}

// ── 生成中状态 ──
.generating-state {
  text-align: center;
  padding: var(--spacing-xxxl) var(--spacing-xl);

  &__icon {
    font-size: 56px;
    margin-bottom: var(--spacing-lg);
  }

  h2 {
    font-size: var(--font-size-h2);
    margin-bottom: var(--spacing-sm);
  }

  &__status {
    margin-top: var(--spacing-base);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__preview {
    max-width: 600px;
    margin: var(--spacing-xl) auto 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}

.preview-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base) var(--spacing-lg) !important;

  &__index {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    white-space: nowrap;
    font-size: var(--font-size-sm);
  }

  &__text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}
</style>
