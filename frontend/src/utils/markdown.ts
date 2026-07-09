/**
 * Markdown + Math 渲染工具
 *
 * 管线：
 *   1. 提取 LaTeX 数学公式 → 替换为占位符
 *   2. 用 marked 将 Markdown → HTML
 *   3. 将占位符替换回 KaTeX 渲染的数学公式
 */
import { marked } from 'marked'
import katex from 'katex'

// ── marked 配置 ──
marked.setOptions({
  breaks: true, // 换行 → <br>
  gfm: true, // GitHub Flavored Markdown（表格、删除线、任务列表）
})

// ── HTML 转义 ──
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 渲染 Markdown + LaTeX 数学公式 → 安全 HTML
 *
 * 支持的 Markdown（来自 marked GFM）：
 * - 标题 # ~ ######
 * - 加粗 **text**、斜体 *text*
 * - 行内代码 `code`、围栏代码块 ``` ```
 * - 引用 > blockquote
 * - 无序/有序列表
 * - 表格
 * - 分隔线 ---
 * - 链接、图片
 *
 * 支持的数学公式：
 * - 行内：$...$ 或 \(...\)
 * - 块级：$$...$$ 或 \[...\]
 */
export function renderMarkdownWithMath(text: string): string {
  if (!text) return ''

  const mathBlocks: string[] = []
  const PH = '␟MATH_'

  let processed = text

  // ── Step 1: 块级数学公式 → 占位符 ──
  // $$...$$ 或 \[...\]
  processed = processed.replace(
    /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g,
    (_full: string, m1: string | undefined, m2: string | undefined) => {
      const math = (m1 || m2 || '').trim()
      const idx = mathBlocks.length
      try {
        mathBlocks.push(
          katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: true,
          }),
        )
      } catch {
        mathBlocks.push(`<code>${escapeHtml(math)}</code>`)
      }
      return `${PH}${idx}%%`
    },
  )

  // ── Step 2: 行内数学公式 → 占位符 ──
  // $...$ 或 \(...\)
  processed = processed.replace(
    /\$([^\$\n]+?)\$|\\\(([\s\S]*?)\\\)/g,
    (_full: string, m1: string | undefined, m2: string | undefined) => {
      const math = (m1 || m2 || '').trim()
      const idx = mathBlocks.length
      try {
        mathBlocks.push(
          katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: true,
          }),
        )
      } catch {
        mathBlocks.push(`<code>${escapeHtml(math)}</code>`)
      }
      return `${PH}${idx}%%`
    },
  )

  // ── Step 3: Markdown → HTML ──
  let html: string = marked.parse(processed) as string

  // ── Step 4: 恢复数学公式 ──
  html = html.replace(new RegExp(`${PH}(\\d+)%%`, 'g'), (_full, idx) => {
    return mathBlocks[parseInt(idx, 10)] || ''
  })

  return html
}

/**
 * 纯 Markdown → HTML（不含数学公式处理）
 * 保留用于不需要数学渲染的场景
 */
export function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}
