<script setup lang="ts">
/** 试卷生成器 — 主页面（新建 / 历史 Tab） */

import { computed } from 'vue'
import { useExamPaperStore } from '@/stores/examPaper'
import { useExamPaperSSE } from '@/composables/useExamPaperSSE'
import { generateExamPaperSSE } from '@/api/modules/examPaper'
import { ElMessage } from 'element-plus'
import type { IExamPaperGenerateRequest } from '@/types'
import ExamConfig from './components/ExamConfig.vue'
import ExamGenerating from './components/ExamGenerating.vue'
import ExamPreview from './components/ExamPreview.vue'
import ExamHistory from './components/ExamHistory.vue'

const store = useExamPaperStore()
const { connect, disconnect } = useExamPaperSSE()

const activeTab = ref<'create' | 'history'>('create')

// 生成试卷
async function handleGenerate(config: IExamPaperGenerateRequest) {
  store.startGeneration(config)

  await connect(generateExamPaperSSE(config), {
    onThinking(_stage: string, message: string) {
      store.setThinking(_stage)
    },
    onContent(chunk: string) {
      store.appendContent(chunk)
    },
    onProgress(_stage: string, _message: string) {
      store.setThinking(_stage)
    },
    onDone(paperId: string, _title: string) {
      store.generationDone(paperId)
      ElMessage.success('试卷生成完成！')
    },
    onError(msg: string) {
      store.generationFailed(msg)
      ElMessage.error(`生成失败：${msg}`)
    },
  })
}

function handleBackToConfig() {
  store.resetStage()
}

function handleBackToCreate() {
  store.resetStage()
}
</script>

<template>
  <div class="exam-paper-page">
    <div class="exam-paper-page__header">
      <h1>试卷生成器</h1>
      <p>AI 智能命题，一键生成高质量试卷，支持 A4 预览与 Word 导出</p>
    </div>

    <!-- 状态机：config → generating → preview -->
    <template v-if="activeTab === 'create'">
      <!-- 配置阶段 -->
      <ExamConfig
        v-if="store.stage === 'config'"
        @generate="handleGenerate"
      />

      <!-- 生成中 -->
      <ExamGenerating
        v-else-if="store.stage === 'generating'"
      />

      <!-- 预览阶段 -->
      <template v-else-if="store.stage === 'preview' && store.generatedPaperId">
        <div class="exam-paper-page__preview-actions">
          <el-button @click="handleBackToCreate">← 返回新建</el-button>
          <el-button type="primary" @click="handleBackToConfig">重新配置</el-button>
        </div>

        <!-- 加载详情后展示预览 -->
        <ExamPreviewLoader :paper-id="store.generatedPaperId" />
      </template>
    </template>

    <!-- 历史列表 -->
    <ExamHistory v-if="activeTab === 'history'" />

    <!-- Tab 切换 -->
    <div class="exam-paper-page__tabs">
      <el-radio-group v-model="activeTab" size="large">
        <el-radio-button value="create">新建试卷</el-radio-button>
        <el-radio-button value="history">历史记录</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<!-- 预览加载器：从 API 获取详情再渲染 -->
<script lang="ts">
import { defineComponent, ref, watch, h } from 'vue'
import { getExamPaperDetail } from '@/api/modules/examPaper'
import type { IExamPaperDetail } from '@/types'
import ExamPreviewVue from './components/ExamPreview.vue'

const ExamPreviewLoader = defineComponent({
  props: { paperId: { type: String, required: true } },
  setup(props) {
    const detail = ref<IExamPaperDetail | null>(null)
    const error = ref('')
    watch(() => props.paperId, async (id) => {
      if (!id) return
      try {
        detail.value = await getExamPaperDetail(id)
      } catch {
        error.value = '加载试卷详情失败'
      }
    }, { immediate: true })
    return () => {
      if (error.value) return h('div', { class: 'text-danger' }, error.value)
      if (!detail.value) return h('div', { class: 'text-muted' }, '加载中...')
      return h(ExamPreviewVue, { content: detail.value.content })
    }
  },
})
</script>

<style lang="scss" scoped>
.exam-paper-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    text-align: center;
    margin-bottom: 28px;
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 8px;
    }
    p {
      font-size: 15px;
      color: var(--color-text-secondary);
    }
  }

  &__preview-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__tabs {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    background: var(--color-bg-white);
    padding: 8px 16px;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
}
</style>
