<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { submitAnswers, buildGenerateRequest } from '@/api/modules/exercise'
import type { IExercise, IGradeResult } from '@/types'
import ExerciseConfig from './components/ExerciseConfig.vue'
import ExerciseList from './components/ExerciseList.vue'
import GradeResultComp from './components/GradeResult.vue'
import ExerciseHistory from './components/ExerciseHistory.vue'

type Stage = 'config' | 'generating' | 'exercises' | 'grading' | 'graded' | 'history'
const stage = ref<Stage>('config')
const exercises = ref<IExercise[]>([])
const currentBatchId = ref('')
const gradeResult = ref<IGradeResult | null>(null)
const genProgress = ref({ current: 0, total: 0 })
const abortCtrl = ref<AbortController | null>(null)

async function handleGenerate(config: any) {
  stage.value = 'generating'; exercises.value = []
  const req = buildGenerateRequest(config)
  const ctrl = new AbortController(); abortCtrl.value = ctrl
  try {
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/exercises/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: 'text/event-stream' },
      body: JSON.stringify(req.body), signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buf = ''
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.type === 'progress') genProgress.value = { current: evt.generated, total: evt.total }
          else if (evt.type === 'exercise' && evt.exercise) exercises.value.push(evt.exercise)
          else if (evt.type === 'done') { currentBatchId.value = evt.batch_id || 'batch-' + Date.now(); stage.value = 'exercises' }
        } catch { /* skip */ }
      }
    }
  } catch (e: any) { if (e.name !== 'AbortError') ElMessage.error(e.message || '生成失败'); stage.value = 'config' }
  finally { abortCtrl.value = null }
}

async function handleSubmit(answers: Array<{ exercise_id: string; user_answer: string }>) {
  stage.value = 'grading'
  try { gradeResult.value = await submitAnswers({ batch_id: currentBatchId.value, answers }); stage.value = 'graded' }
  catch (e: any) { ElMessage.error(e.message || '批改失败'); stage.value = 'exercises' }
}

onUnmounted(() => abortCtrl.value?.abort())
</script>

<template>
  <div class="page-container">
    <div style="display:flex;justify-content:flex-end;margin-bottom:var(--spacing-base)">
      <el-button
        v-if="stage !== 'history'"
        size="small"
        text
        @click="stage = 'history'"
      >
        📋 历史记录
      </el-button>
    </div>
    <ExerciseConfig v-if="stage === 'config'" @generate="handleGenerate" />
    <div v-if="stage === 'generating'" class="card" style="text-align:center;padding:var(--spacing-xxxl)">
      <el-icon :size="32" class="is-loading"><Loading /></el-icon>
      <p style="margin-top:var(--spacing-base)">AI 正在生成习题...</p>
      <el-progress :percentage="genProgress.total ? Math.round(genProgress.current / genProgress.total * 100) : 0" style="max-width:300px;margin:var(--spacing-lg) auto 0" />
    </div>
    <ExerciseList v-if="stage === 'exercises'" :exercises="exercises" :batch-id="currentBatchId" :grade-result="null" @submit="handleSubmit" @back-to-config="stage = 'config'" />
    <GradeResultComp v-if="stage === 'graded' && gradeResult" :grade-result="gradeResult" :exercises="exercises" @retry="stage = 'config'" @view-history="stage = 'history'" />
    <ExerciseHistory v-if="stage === 'history'" @view-detail="(id: string) => {}" @back="stage = 'config'" />
  </div>
</template>
