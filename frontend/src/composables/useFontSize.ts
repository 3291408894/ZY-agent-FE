// ================================================================
// 智翼 (ZhiYi) — 字体调节组合式函数
// 无级连续调节 12px-20px，支持键盘快捷键
// ================================================================

import { computed, onMounted, onUnmounted } from 'vue'
import {
  useThemeStore,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_DEFAULT,
  FONT_PRESETS,
} from '@/stores/theme'

export { FONT_PRESETS, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT }

export function useFontSize() {
  const themeStore = useThemeStore()

  const currentPx = computed(() => themeStore.fontSize)
  const currentPercent = computed(() => themeStore.fontSizePercent)
  const canDecrease = computed(() => currentPx.value > FONT_SIZE_MIN)
  const canIncrease = computed(() => currentPx.value < FONT_SIZE_MAX)
  const isDefault = computed(() => currentPx.value === FONT_SIZE_DEFAULT)

  /** 当前字号标签（如 "15px / 100%"） */
  const sizeLabel = computed(() => `${currentPx.value}px (${currentPercent.value}%)`)

  function setFontSize(px: number) {
    themeStore.setFontSize(px)
  }

  function increase() {
    themeStore.increaseFontSize()
  }

  function decrease() {
    themeStore.decreaseFontSize()
  }

  function reset() {
    themeStore.resetFontSize()
  }

  // ── 键盘快捷键 Ctrl+Plus / Ctrl+Minus / Ctrl+0 ──

  function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        increase()
      } else if (e.key === '-') {
        e.preventDefault()
        decrease()
      } else if (e.key === '0') {
        e.preventDefault()
        reset()
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })

  return {
    currentPx,
    currentPercent,
    sizeLabel,
    canDecrease,
    canIncrease,
    isDefault,
    presets: FONT_PRESETS,
    setFontSize,
    increase,
    decrease,
    reset,
  }
}
