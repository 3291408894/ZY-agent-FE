<script setup lang="ts">
// ================================================================
// FilesView — 文件管理页面（骨架）
// 对应 PBI_05：多格式文件上传解析
// ================================================================
</script>

<template>
  <div class="files-page">
    <div class="page-header">
      <div>
        <h1 class="page-header__title">文件管理</h1>
        <p class="page-header__subtitle">上传学习资料，AI 自动解析并生成总结/习题</p>
      </div>
    </div>

    <div class="card" style="text-align: center; padding: var(--spacing-xxxl);">
      <div class="empty-state">
        <div class="empty-state__icon">📂</div>
        <div class="empty-state__text">文件管理功能开发中</div>
        <p style="color: var(--color-text-placeholder); font-size: var(--font-size-sm); margin-top: var(--spacing-sm);">
          支持 TXT/MD/PDF/DOCX/CSV/JSON/HTML/XML/YAML 共 9 种格式上传解析
        </p>
        <el-tag type="warning" style="margin-top: var(--spacing-base);">Sprint 2 交付</el-tag>
      </div>
    </div>
  </div>
</template>
