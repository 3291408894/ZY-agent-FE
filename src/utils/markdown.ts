/** 安全的 Markdown → HTML 渲染工具，支持 LaTeX 数学公式 */

import katex from 'katex'

/**
 * HTML 实体转义 —— 防止 XSS 攻击
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** 修复常见 LaTeX 格式错误 */
function fixLatexErrors(formula: string): string {
  return formula
    // \frac{x}y → \frac{x}{y}
    .replace(/\\frac\{([^}]*)\}([^{])/g, '\\frac{$1}{$2}')
    // \sqrt x → \sqrt{x}（仅当后面是单个字符时）
    .replace(/\\sqrt\s+([a-z0-9])/gi, '\\sqrt{$1}')
}

/** KaTeX 渲染，失败返回原文 */
function renderFormula(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula.trim(), { displayMode, throwOnError: false })
  } catch {
    return formula
  }
}

/**
 * 渲染文本中的 LaTeX 公式为 HTML
 *
 * 处理顺序：
 * 1. 统一定界符：\(\) → $, \[\] → $$
 * 2. 提取 $...$ 和 $$...$$ 包裹的公式 → 占位符
 * 3. 扫描剩余文本中的裸 LaTeX（\command）→ 自动包裹 → 渲染
 * 4. 对纯文本做 HTML 转义
 * 5. 恢复占位符（已渲染的公式 HTML）
 */
export function renderLatex(text: string): string {
  if (!text) return text

  const PH = '￼'
  const rendered: string[] = []

  // Step 1 — 统一定界符
  let s = text
    .replace(/\\\(([^)]+)\\\)/g, (_m: string, f: string) => `$${f}$`)
    .replace(/\\\[([^\]]+)\\\]/g, (_m: string, f: string) => `$$${f}$$`)

  // Step 2 — 提取 $...$ / $$...$$ 公式 → 占位符
  s = s.replace(/\$\$([^$]+)\$\$/g, (_m: string, f: string) => {
    rendered.push(renderFormula(f, true))
    return `${PH}${rendered.length - 1}${PH}`
  })
  s = s.replace(/\$([^$]+)\$/g, (_m: string, f: string) => {
    rendered.push(renderFormula(f, false))
    return `${PH}${rendered.length - 1}${PH}`
  })

  // Step 3 — 剩余文本中，任何含 \command 的段落整体渲染
  const parts = s.split(new RegExp(`${PH}\\d+${PH}`))
  const holders = s.match(new RegExp(`${PH}\\d+${PH}`, 'g')) || []

  const processed = parts.map(part => {
    if (!part) return part
    if (!/\\[a-zA-Z]/.test(part)) return part
    const fixed = fixLatexErrors(part.trim())
    if (!fixed) return part
    rendered.push(renderFormula(fixed, false))
    return `${PH}${rendered.length - 1}${PH}`
  })

  s = ''
  for (let i = 0; i < processed.length; i++) {
    s += processed[i]
    if (i < holders.length) s += holders[i]
  }

  // Step 4 — HTML 转义 + 恢复占位符
  s = escapeHtml(s)
  s = s.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'),
    (_m, idx: string) => rendered[parseInt(idx)] || _m)

  return s
}

/**
 * 将 LLM 输出的 Markdown 文本安全地转换为 HTML
 *
 * 支持的语法：
 * - 标题 # ## ###
 * - 加粗 **text**
 * - 无序列表 - item
 *
 * 安全性：先提取公式 → 转义 Markdown 文本 → 恢复公式
 */
export function renderMarkdown(text: string): string {
  if (!text) return text

  const rendered: string[] = []
  const PH = '￼'

  // 统一定界符 + 提取公式
  let html = text
    .replace(/\\\(([^)]+)\\\)/g, (_m: string, f: string) => `$${f}$`)
    .replace(/\\\[([^\]]+)\\\]/g, (_m: string, f: string) => `$$${f}$$`)

  html = html.replace(/\$\$([^$]+)\$\$/g, (_m: string, f: string) => {
    rendered.push(renderFormula(f, true))
    return `${PH}${rendered.length - 1}${PH}`
  })
  html = html.replace(/\$([^$]+)\$/g, (_m: string, f: string) => {
    rendered.push(renderFormula(f, false))
    return `${PH}${rendered.length - 1}${PH}`
  })

  // 剩余段落含裸 LaTeX → 整体渲染
  {
    const parts = html.split(new RegExp(`${PH}\\d+${PH}`))
    const holders = html.match(new RegExp(`${PH}\\d+${PH}`, 'g')) || []
    const processed = parts.map(part => {
      if (!part) return part
      if (!/\\[a-zA-Z]/.test(part)) return part
      const fixed = fixLatexErrors(part.trim())
      if (!fixed) return part
      rendered.push(renderFormula(fixed, false))
      return `${PH}${rendered.length - 1}${PH}`
    })
    html = ''
    for (let i = 0; i < processed.length; i++) {
      html += processed[i]
      if (i < holders.length) html += holders[i]
    }
  }

  // HTML 转义 + Markdown 处理
  html = escapeHtml(html)

  html = html
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<\/li>)\n(<li>)/g, '$1$2')
    .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>')

  // 恢复公式
  html = html.replace(new RegExp(`${PH}(\\d+)${PH}`, 'g'),
    (_m, idx: string) => rendered[parseInt(idx)] || _m)

  return html
}
