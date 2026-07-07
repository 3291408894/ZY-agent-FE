// ================================================================
// 智翼 (ZhiYi) — 主题状态管理 (Pinia Store)
// 对应 PBI_03：UI/UX 护眼主题 + 无级字体调节
// ================================================================

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 主题模式 */
export type ThemeMode = 'light' | 'dark'

/** 主色方案 */
export type ColorScheme = 'eye-care' | 'classic'

/** 字体大小常量 */
export const FONT_SIZE_MIN = 12
export const FONT_SIZE_MAX = 20
export const FONT_SIZE_DEFAULT = 15
export const FONT_SIZE_STEP = 1

/** 预设档位 */
export const FONT_PRESETS = [
  { label: '小', value: 13, desc: '紧凑浏览' },
  { label: '中', value: 15, desc: '默认推荐' },
  { label: '大', value: 17, desc: '舒适阅读' },
] as const

/** LocalStorage keys */
const STORAGE_KEYS = {
  fontSize: 'zhiyi-font-size-px',
  themeMode: 'zhiyi-theme-mode',
  colorScheme: 'zhiyi-color-scheme',
  readingMode: 'zhiyi-reading-mode',
} as const

export const useThemeStore = defineStore('theme', () => {
  // ================================================================
  // State
  // ================================================================
  const fontSize = ref<number>(loadFontSize())
  const themeMode = ref<ThemeMode>(loadThemeMode())
  const colorScheme = ref<ColorScheme>(loadColorScheme())
  const readingMode = ref<boolean>(loadReadingMode())

  // ================================================================
  // Getters
  // ================================================================
  const fontSizePx = computed(() => `${fontSize.value}px`)
  const fontSizePercent = computed(() => Math.round((fontSize.value / FONT_SIZE_DEFAULT) * 100))
  const isDark = computed(() => themeMode.value === 'dark')

  // ================================================================
  // Actions — 字体大小（无级调节 12px-20px）
  // ================================================================

  function setFontSize(px: number) {
    const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, px))
    fontSize.value = clamped
    applyFontSize(clamped)
    localStorage.setItem(STORAGE_KEYS.fontSize, String(clamped))
  }

  function increaseFontSize() {
    setFontSize(fontSize.value + FONT_SIZE_STEP)
  }

  function decreaseFontSize() {
    setFontSize(fontSize.value - FONT_SIZE_STEP)
  }

  function resetFontSize() {
    setFontSize(FONT_SIZE_DEFAULT)
  }

  function applyFontSize(px: number) {
    document.documentElement.style.setProperty('--font-size-base', `${px}px`)
    // 同步调整所有关联字号
    document.documentElement.style.setProperty('--font-size-xs', `${px - 3}px`)
    document.documentElement.style.setProperty('--font-size-sm', `${px - 1}px`)
    document.documentElement.style.setProperty('--font-size-lg', `${px + 2}px`)
    document.documentElement.style.setProperty('--font-size-xl', `${px + 4}px`)
    document.documentElement.style.setProperty('--font-size-xxl', `${px + 8}px`)
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
  // 初始化
  // ================================================================

  function init() {
    applyFontSize(fontSize.value)
    document.documentElement.setAttribute('data-theme', themeMode.value)
    document.documentElement.setAttribute('data-color-scheme', colorScheme.value)
    document.documentElement.setAttribute('data-reading-mode', String(readingMode.value))
  }

  return {
    // state
    fontSize,
    themeMode,
    colorScheme,
    readingMode,
    // getters
    fontSizePx,
    fontSizePercent,
    isDark,
    // actions — 字体
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    // actions — 主题
    setThemeMode,
    toggleThemeMode,
    setColorScheme,
    setReadingMode,
    toggleReadingMode,
    init,
  }
})

// ================================================================
// 辅助函数
// ================================================================

function loadFontSize(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.fontSize)
  if (stored) {
    const n = parseInt(stored, 10)
    if (n >= FONT_SIZE_MIN && n <= FONT_SIZE_MAX) return n
  }
  // 兼容旧版 'small'/'medium'/'large' 格式
  const legacy = localStorage.getItem('zhiyi-font-size')
  if (legacy === 'small') return 13
  if (legacy === 'large') return 17
  return FONT_SIZE_DEFAULT
}

function loadThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEYS.themeMode)
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

function loadColorScheme(): ColorScheme {
  const stored = localStorage.getItem(STORAGE_KEYS.colorScheme)
  if (stored === 'eye-care' || stored === 'classic') return stored
  return 'eye-care'
}

function loadReadingMode(): boolean {
  return localStorage.getItem(STORAGE_KEYS.readingMode) === 'true'
}
