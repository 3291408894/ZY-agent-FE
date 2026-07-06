<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const themeStore = useThemeStore()
const isFullscreen = computed(() => route.meta.layout === 'fullscreen')

// 初始化主题：从 localStorage 恢复到 DOM，确保 CSS 变量生效
onMounted(() => {
  themeStore.init()
})
</script>

<template>
  <template v-if="isFullscreen">
    <router-view />
  </template>
  <AppLayout v-else>
    <router-view />
  </AppLayout>
</template>
