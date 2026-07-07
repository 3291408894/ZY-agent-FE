<script setup lang="ts">
/** 难度配比三色滑块 — 简单绿 / 中等黄 / 困难红，总和必须为100% */

import { computed, watch } from 'vue'

const props = defineProps<{
  modelValue: { easy: number; medium: number; hard: number }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { easy: number; medium: number; hard: number }]
}>()

const total = computed(() => props.modelValue.easy + props.modelValue.medium + props.modelValue.hard)
const isValid = computed(() => total.value === 100)

function update(key: 'easy' | 'medium' | 'hard', val: number) {
  const v = Math.max(0, Math.min(100, Math.round(val)))
  emit('update:modelValue', { ...props.modelValue, [key]: v })
}
</script>

<template>
  <div class="difficulty-slider">
    <div class="difficulty-slider__header">
      <span>难度配比</span>
      <span :class="{ 'is-invalid': !isValid }">
        总和：{{ total }}% {{ isValid ? '✓' : '(需为100%)' }}
      </span>
    </div>

    <div class="difficulty-slider__bars">
      <!-- 简单 -->
      <div class="difficulty-slider__bar difficulty-slider__bar--easy">
        <label>简单</label>
        <el-slider
          :model-value="modelValue.easy"
          :min="0"
          :max="100"
          :step="5"
          @update:model-value="update('easy', $event as number)"
        />
        <span class="difficulty-slider__value">{{ modelValue.easy }}%</span>
      </div>

      <!-- 中等 -->
      <div class="difficulty-slider__bar difficulty-slider__bar--medium">
        <label>中等</label>
        <el-slider
          :model-value="modelValue.medium"
          :min="0"
          :max="100"
          :step="5"
          @update:model-value="update('medium', $event as number)"
        />
        <span class="difficulty-slider__value">{{ modelValue.medium }}%</span>
      </div>

      <!-- 困难 -->
      <div class="difficulty-slider__bar difficulty-slider__bar--hard">
        <label>困难</label>
        <el-slider
          :model-value="modelValue.hard"
          :min="0"
          :max="100"
          :step="5"
          @update:model-value="update('hard', $event as number)"
        />
        <span class="difficulty-slider__value">{{ modelValue.hard }}%</span>
      </div>
    </div>

    <!-- 可视化预览条 -->
    <div class="difficulty-slider__preview">
      <div
        class="difficulty-slider__preview-bar difficulty-slider__preview-bar--easy"
        :style="{ width: modelValue.easy + '%' }"
      ></div>
      <div
        class="difficulty-slider__preview-bar difficulty-slider__preview-bar--medium"
        :style="{ width: modelValue.medium + '%' }"
      ></div>
      <div
        class="difficulty-slider__preview-bar difficulty-slider__preview-bar--hard"
        :style="{ width: modelValue.hard + '%' }"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.difficulty-slider {
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--color-text-secondary);
    .is-invalid { color: var(--el-color-danger); }
  }

  &__bars { display: flex; flex-direction: column; gap: 8px; }

  &__bar {
    display: flex;
    align-items: center;
    gap: 12px;
    label {
      width: 36px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .el-slider { flex: 1; }
    &--easy .el-slider { --el-slider-main-bg-color: #67C23A; }
    &--medium .el-slider { --el-slider-main-bg-color: #E6A23C; }
    &--hard .el-slider { --el-slider-main-bg-color: #F56C6C; }
  }

  &__value {
    width: 40px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__preview {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 12px;
    background: var(--color-bg-secondary);
  }

  &__preview-bar {
    height: 100%;
    transition: width 0.3s ease;
    &--easy { background: #67C23A; }
    &--medium { background: #E6A23C; }
    &--hard { background: #F56C6C; }
  }
}
</style>
