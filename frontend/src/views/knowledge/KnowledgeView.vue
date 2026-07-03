<script setup lang="ts">
// ================================================================
// KnowledgeView — 知识图谱页面（骨架）
// 对应 PBI_11：知识图谱可视化
// ================================================================
</script>

<template>
  <div class="knowledge-page">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">知识图谱</h1>
        <p class="page-header__subtitle">可视化知识结构，点击节点查看详情</p>
      </div>
    </div>

    <div class="card" style="text-align: center; padding: var(--spacing-xxxl);">
      <div class="empty-state">
        <div class="empty-state__icon">🔗</div>
        <div class="empty-state__text">知识图谱功能开发中</div>
        <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          基于学科/知识点自动生成图谱，支持拖拽缩放、节点详情、导出图片
        </p>
        <el-tag type="warning" style="margin-top: var(--spacing-base);">Sprint 2 交付</el-tag>
      </div>
    </div>
  </div>
</template>
