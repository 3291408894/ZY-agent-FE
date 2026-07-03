<script setup lang="ts">
// ================================================================
// ExerciseView — 习题练习页面（骨架）
// 对应 PBI_08/09/10：智能习题生成 + 双模式 + 实时批改
// ================================================================
</script>

<template>
  <div class="exercise-page">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">习题练习</h1>
        <p class="page-header__subtitle">智能生成习题，支持做题/解析双模式</p>
      </div>
    </div>

    <div class="card" style="text-align: center; padding: var(--spacing-xxxl);">
      <div class="empty-state">
        <div class="empty-state__icon">✏️</div>
        <div class="empty-state__text">习题功能开发中</div>
        <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          按学科/知识点自定义出题，支持选择/填空/简答/计算/辨析 5 种题型，自动批改反馈
        </p>
        <el-tag type="warning" style="margin-top: var(--spacing-base);">Sprint 2 交付</el-tag>
      </div>
    </div>
  </div>
</template>
