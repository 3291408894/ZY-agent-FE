<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="not-found">
    <div class="not-found__code">404</div>
    <h1>页面未找到</h1>
    <p>你访问的页面不存在或已被移除</p>
    <el-button type="primary" @click="router.push('/dashboard')">返回首页</el-button>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; text-align: center;
  &__code { font-size: 96px; font-weight: var(--font-weight-bold); color: var(--color-primary); opacity: 0.4; line-height: 1; margin-bottom: var(--spacing-base); }
  h1 { margin-bottom: var(--spacing-sm); }
  p { color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); }
}
</style>
