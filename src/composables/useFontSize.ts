// ================================================================
// 智翼 (ZhiYi) — 字体调节组合式函数
// 对应 PBI_03 验收条件 2：字体三档可调
// ================================================================

import { computed } from 'vue'
import { useThemeStore, type FontSizeLevel } from '@/stores/theme'

/** 字体大小选项（供下拉菜单使用） */
export interface FontSizeOption {
  label: string
  value: FontSizeLevel
  description: string
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { label: '小', value: 'small', description: '适合高密度信息浏览' },
  { label: '中', value: 'medium', description: '默认字号，推荐日常使用' },
  { label: '大', value: 'large', description: '适合长时间阅读，减缓眼疲劳' },
]

export function useFontSize() {
  const themeStore = useThemeStore()

  /** 当前档位 */
  const currentLevel = computed(() => themeStore.fontSizeLevel)

  /** 当前档位标签 */
  const currentLabel = computed(() => {
    const opt = FONT_SIZE_OPTIONS.find((o) => o.value === currentLevel.value)
    return opt?.label ?? '中'
  })

  /** 设置字体大小 */
  function setFontSize(level: FontSizeLevel) {
    themeStore.setFontSize(level)
  }

  /** 循环切换（小 → 中 → 大 → 小） */
  function cycleFontSize() {
    themeStore.cycleFontSize()
  }

  /** 放大一档 */
  function increase() {
    const levels: FontSizeLevel[] = ['small', 'medium', 'large']
    const idx = levels.indexOf(currentLevel.value)
    if (idx < levels.length - 1) {
      setFontSize(levels[idx + 1])
    }
  }

  /** 缩小一档 */
  function decrease() {
    const levels: FontSizeLevel[] = ['small', 'medium', 'large']
    const idx = levels.indexOf(currentLevel.value)
    if (idx > 0) {
      setFontSize(levels[idx - 1])
    }
  }

  return {
    currentLevel,
    currentLabel,
    options: FONT_SIZE_OPTIONS,
    setFontSize,
    cycleFontSize,
    increase,
    decrease,
  }
}
