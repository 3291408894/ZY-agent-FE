<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const isFullscreen = computed(() => route.meta.layout === 'fullscreen')
</script>

<template>
  <template v-if="isFullscreen">
    <router-view />
  </template>
  <AppLayout v-else>
    <router-view />
  </AppLayout>
</template>
