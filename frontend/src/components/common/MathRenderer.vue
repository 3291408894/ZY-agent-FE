<script setup lang="ts">
/** 数学公式渲染组件 — 将文本中的 $...$ 和 $$...$$ 渲染为 KaTeX */

import { computed } from 'vue'
import katex from 'katex'

const props = defineProps<{
  text: string
  displayMode?: boolean
}>()

interface Segment {
  type: 'text' | 'math-inline' | 'math-block'
  content: string
}

const segments = computed<Segment[]>(() => {
  const text = props.text
  if (!text) return []

  const result: Segment[] = []

  // Match \(...\) (LaTeX inline), \[...\] (LaTeX block), $$...$$ (block), $...$ (inline)
  // Groups: 1=\[...\] block, 2=\(...\) inline, 3=$$...$$ block, 4=$...$ inline
  const mathRegex = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mathRegex.exec(text)) !== null) {
    // Text before the math
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    // Block math: \[...\] (group 1) or $$...$$ (group 3)
    if (match[1] !== undefined) {
      result.push({ type: 'math-block', content: match[1].trim() })
    } else if (match[3] !== undefined) {
      result.push({ type: 'math-block', content: match[3].trim() })
    } else if (match[2] !== undefined) {
      // Inline math: \(...\) (group 2)
      result.push({ type: 'math-inline', content: match[2].trim() })
    } else if (match[4] !== undefined) {
      // Inline math: $...$ (group 4)
      result.push({ type: 'math-inline', content: match[4].trim() })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    result.push({
      type: 'text',
      content: text.slice(lastIndex),
    })
  }

  return result
})

/** 是否包含块级公式 — 决定根元素用 div（块级）还是 span（内联） */
const hasBlock = computed(() => segments.value.some(s => s.type === 'math-block'))

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    })
  } catch {
    return `<code>${escapeHtml(latex)}</code>`
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<template>
  <component :is="hasBlock ? 'div' : 'span'" class="math-renderer">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.type === 'text'">{{ seg.content }}</span>
      <span
        v-else-if="seg.type === 'math-inline'"
        class="math-renderer__inline"
        v-html="renderMath(seg.content, false)"
      />
      <div
        v-else-if="seg.type === 'math-block'"
        class="math-renderer__block"
        v-html="renderMath(seg.content, true)"
      />
    </template>
  </component>
</template>

<style lang="scss" scoped>
.math-renderer {
  &__inline {
    display: inline;
  }

  &__block {
    display: block;
    margin: 12px 0;
    text-align: center;
    overflow-x: auto;
  }
}
</style>
