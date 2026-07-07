<script setup lang="ts">
/** 题型分布编辑器 — 动态增删行、小计自动计算、总分校验 */

import { computed } from 'vue'
import type { IQuestionTypeConfig } from '@/types'

const props = defineProps<{
  modelValue: IQuestionTypeConfig[]
  totalScore: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: IQuestionTypeConfig[]]
}>()

const subtotal = computed(() => props.modelValue.reduce((s, q) => s + q.subtotal, 0))
const isValid = computed(() => subtotal.value === props.totalScore)

function addRow() {
  const last = props.modelValue[props.modelValue.length - 1]
  const newRow: IQuestionTypeConfig = {
    type: '',
    count: last?.count ?? 5,
    score_per: last?.score_per ?? 5,
    subtotal: (last?.count ?? 5) * (last?.score_per ?? 5),
  }
  emit('update:modelValue', [...props.modelValue, newRow])
}

function removeRow(index: number) {
  const arr = [...props.modelValue]
  arr.splice(index, 1)
  emit('update:modelValue', arr)
}

function updateRow(index: number, field: keyof IQuestionTypeConfig, val: string | number) {
  const arr = props.modelValue.map((row, i) => {
    if (i !== index) return row
    const updated = { ...row, [field]: val }
    if (field === 'count' || field === 'score_per') {
      updated.subtotal = updated.count * updated.score_per
    }
    if (field === 'subtotal') {
      updated.score_per = updated.count > 0 ? Math.round(updated.subtotal / updated.count) : 0
    }
    return updated
  })
  emit('update:modelValue', arr)
}
</script>

<template>
  <div class="structure-editor">
    <div class="structure-editor__header">
      <span>题型分布</span>
      <span :class="{ 'is-invalid': !isValid }">
        小计：{{ subtotal }} / {{ totalScore }} 分
        {{ isValid ? '✓' : '(需与总分一致)' }}
      </span>
    </div>

    <div class="structure-editor__table">
      <div
        v-for="(row, i) in modelValue"
        :key="i"
        class="structure-editor__row"
      >
        <el-input
          :model-value="row.type"
          placeholder="题型名称"
          size="default"
          style="width: 130px"
          @update:model-value="updateRow(i, 'type', $event)"
        />
        <span class="structure-editor__sep">共</span>
        <el-input-number
          :model-value="row.count"
          :min="1"
          :max="50"
          size="default"
          controls-position="right"
          style="width: 90px"
          @update:model-value="updateRow(i, 'count', $event as number)"
        />
        <span class="structure-editor__sep">道，每题</span>
        <el-input-number
          :model-value="row.score_per"
          :min="1"
          :max="100"
          size="default"
          controls-position="right"
          style="width: 90px"
          @update:model-value="updateRow(i, 'score_per', $event as number)"
        />
        <span class="structure-editor__sep">分 =</span>
        <span class="structure-editor__subtotal">{{ row.subtotal }}分</span>
        <el-button
          v-if="modelValue.length > 1"
          type="danger"
          :icon="'Delete'"
          circle
          size="small"
          plain
          @click="removeRow(i)"
        />
      </div>
    </div>

    <el-button
      v-if="modelValue.length < 10"
      type="primary"
      plain
      size="small"
      @click="addRow"
    >
      + 添加题型
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.structure-editor {
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--color-text-secondary);
    .is-invalid { color: var(--el-color-danger); }
  }

  &__table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    flex-wrap: wrap;
  }

  &__sep {
    font-size: 13px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__subtotal {
    font-weight: 700;
    font-size: 15px;
    color: var(--color-primary);
    min-width: 50px;
  }
}
</style>
