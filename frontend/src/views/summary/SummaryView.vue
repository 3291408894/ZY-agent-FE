<script setup lang="ts">
// ================================================================
// SummaryView — 课文总结页面（骨架）
// 对应 PBI_06：智能课文总结
// ================================================================
import { ref } from 'vue'
const inputMode = ref<'text' | 'file'>('text')
const content = ref('')
const mode = ref<'brief' | 'detailed'>('brief')
</script>

<template>
  <div class="summary-page">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">课文总结</h1>
        <p class="page-header__subtitle">输入课文内容，AI 自动生成结构化总结</p>
      </div>
    </div>

    <div class="card" style="text-align: center; padding: var(--spacing-xxxl);">
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <div class="empty-state__text">课文总结功能开发中</div>
        <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          支持手动输入/粘贴课文内容，AI 将生成精简版或详细版的结构化总结
        </p>
        <el-tag style="margin-top: var(--spacing-base);">Sprint 1 交付</el-tag>
      </div>
    </div>
  </div>
</template>
