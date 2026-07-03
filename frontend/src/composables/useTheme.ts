// ================================================================
// 智翼 (ZhiYi) — 主题组合式函数
// 封装主题模式切换、配色方案切换逻辑
// ================================================================

import { computed } from 'vue'
import { useThemeStore, type ThemeMode, type ColorScheme } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()

  /** 当前是否为暗色模式 */
  const isDark = computed(() => themeStore.themeMode === 'dark')

  /** 当前模式的中文标签 */
  const modeLabel = computed(() => (isDark.value ? '暗色模式' : '护眼模式'))

  /** 切换亮色/暗色 */
  function toggleMode() {
    themeStore.toggleThemeMode()
  }

  /** 设置主题模式 */
  function setMode(mode: ThemeMode) {
    themeStore.setThemeMode(mode)
  }

  /** 设置配色方案 */
  function setColorScheme(scheme: ColorScheme) {
    themeStore.setColorScheme(scheme)
  }

  return {
    isDark,
    modeLabel,
    themeMode: computed(() => themeStore.themeMode),
    colorScheme: computed(() => themeStore.colorScheme),
    toggleMode,
    setMode,
    setColorScheme,
  }
}
