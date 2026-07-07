// ================================================================
// 智翼 (ZhiYi) — 主题状态管理 (Pinia Store)
// 对应 PBI_03：UI/UX 护眼主题 + 字体调节
// ================================================================

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/** 字体档位 */
export type FontSizeLevel = 'small' | 'medium' | 'large'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark'

/** 主色方案 */
export type ColorScheme = 'eye-care' | 'classic'

/** 字体大小映射 */
const FONT_SIZE_MAP: Record<FontSizeLevel, string> = {
  small: '13px',
  medium: '15px',
  large: '17px',
}

/** LocalStorage keys */
const STORAGE_KEYS = {
  fontSize: 'zhiyi-font-size',
  themeMode: 'zhiyi-theme-mode',
  colorScheme: 'zhiyi-color-scheme',
  readingMode: 'zhiyi-reading-mode',
} as const

export const useThemeStore = defineStore('theme', () => {
  // ================================================================
  // State
  // ================================================================
  const fontSizeLevel = ref<FontSizeLevel>(loadFontSize())
  const themeMode = ref<ThemeMode>(loadThemeMode())
  const colorScheme = ref<ColorScheme>(loadColorScheme())
  const readingMode = ref<boolean>(loadReadingMode())

  // ================================================================
  // Getters
  // ================================================================
  const currentFontSize = () => FONT_SIZE_MAP[fontSizeLevel.value]
  const isDark = () => themeMode.value === 'dark'

  // ================================================================
  // Actions — 字体大小
  // ================================================================
  function setFontSize(level: FontSizeLevel) {
    fontSizeLevel.value = level
    document.documentElement.style.setProperty(
      '--font-size-base',
      FONT_SIZE_MAP[level]
    )
    localStorage.setItem(STORAGE_KEYS.fontSize, level)
  }

  function cycleFontSize() {
    const levels: FontSizeLevel[] = ['small', 'medium', 'large']
    const idx = levels.indexOf(fontSizeLevel.value)
    const next = levels[(idx + 1) % levels.length]
    setFontSize(next)
  }

  // ================================================================
  // Actions — 主题模式
  // ================================================================
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem(STORAGE_KEYS.themeMode, mode)
  }

  function toggleThemeMode() {
    setThemeMode(themeMode.value === 'light' ? 'dark' : 'light')
  }

  // ================================================================
  // Actions — 配色方案
  // ================================================================
  function setColorScheme(scheme: ColorScheme) {
    colorScheme.value = scheme
    document.documentElement.setAttribute('data-color-scheme', scheme)
    localStorage.setItem(STORAGE_KEYS.colorScheme, scheme)
  }

  // ================================================================
  // Actions — 阅读模式
  // ================================================================
  function setReadingMode(enabled: boolean) {
    readingMode.value = enabled
    document.documentElement.setAttribute('data-reading-mode', String(enabled))
    localStorage.setItem(STORAGE_KEYS.readingMode, String(enabled))
  }

  function toggleReadingMode() {
    setReadingMode(!readingMode.value)
  }

  // ================================================================
  // 初始化：从 localStorage 恢复并应用到 DOM
  // ================================================================
  function init() {
    document.documentElement.style.setProperty(
      '--font-size-base',
      FONT_SIZE_MAP[fontSizeLevel.value]
    )
    document.documentElement.setAttribute('data-theme', themeMode.value)
    document.documentElement.setAttribute(
      'data-color-scheme',
      colorScheme.value
    )
    document.documentElement.setAttribute(
      'data-reading-mode',
      String(readingMode.value)
    )
  }

  return {
    // state
    fontSizeLevel,
    themeMode,
    colorScheme,
    readingMode,
    // getters (as functions for reactivity)
    currentFontSize,
    isDark,
    // actions
    setFontSize,
    cycleFontSize,
    setThemeMode,
    toggleThemeMode,
    setColorScheme,
    setReadingMode,
    toggleReadingMode,
    init,
  }
})

// ================================================================
// 辅助函数：从 localStorage 加载，带默认值
// ================================================================
function loadFontSize(): FontSizeLevel {
  const stored = localStorage.getItem(STORAGE_KEYS.fontSize)
  if (stored === 'small' || stored === 'medium' || stored === 'large') {
    return stored
  }
  return 'medium'
}

function loadThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEYS.themeMode)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return 'light'
}

function loadColorScheme(): ColorScheme {
  const stored = localStorage.getItem(STORAGE_KEYS.colorScheme)
  if (stored === 'eye-care' || stored === 'classic') {
    return stored
  }
  return 'eye-care'
}

function loadReadingMode(): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.readingMode)
  return stored === 'true'
}
