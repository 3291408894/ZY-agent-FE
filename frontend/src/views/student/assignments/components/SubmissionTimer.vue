<script setup lang="ts">
/**
 * 截止倒计时组件
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ dueDate: string }>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const dueTime = computed(() => new Date(props.dueDate).getTime())
const remaining = computed(() => Math.max(0, dueTime.value - now.value))

const hours = computed(() => Math.floor(remaining.value / (1000 * 60 * 60)))
const minutes = computed(() => Math.floor((remaining.value % (1000 * 60 * 60)) / (1000 * 60)))
const seconds = computed(() => Math.floor((remaining.value % (1000 * 60)) / 1000))

const isUrgent = computed(() => remaining.value < 3600000) // 小于1小时

const display = computed(() => {
  if (remaining.value <= 0) return '已截止'
  const h = String(hours.value).padStart(2, '0')
  const m = String(minutes.value).padStart(2, '0')
  const s = String(seconds.value).padStart(2, '0')
  return `剩余 ${h}:${m}:${s}`
})
</script>

<template>
  <span class="submission-timer" :class="{ urgent: isUrgent, overdue: remaining <= 0 }">
    {{ display }}
  </span>
</template>

<style scoped lang="scss">
.submission-timer {
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  &.urgent {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  &.overdue {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}
</style>
