/** 安全的 Markdown → HTML 渲染工具 */

/**
 * HTML 实体转义 —— 防止 XSS 攻击
 * 在 markdown 转换之前先转义所有用户/LLM 输出中的 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 将 LLM 输出的 Markdown 文本安全地转换为 HTML
 *
 * 支持的语法：
 * - 标题 # ## ###
 * - 加粗 **text**
 * - 无序列表 - item
 *
 * 安全性：先对全文做 HTML 实体转义，再进行 Markdown 语法替换，
 * 保证即使 LLM 输出恶意脚本也不会被执行。
 *
 * 顺序设计：列表处理在换行转换之前，列表内部的换行被主动清除，
 * 避免 <br/> 出现在 <ul> 标签内部。
 */
export function renderMarkdown(text: string): string {
  // 1. 先转义 HTML，防止 XSS
  let html = escapeHtml(text)

  // 2. 标题转换（在行首匹配）
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')

  // 3. 加粗转换
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 4. 无序列表处理（在换行转 <br/> 之前）
  //    a. 转换列表项：- item → <li>item</li>
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  //    b. 清除连续 <li> 之间的换行符，避免被后续 <br/> 污染
  html = html.replace(/(<\/li>)\n(<li>)/g, '$1$2')
  //    c. 包裹连续的 <li> 到 <ul> 中
  html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>')

  // 5. 剩余换行转 <br/>（此时 <ul> 内部已无换行）
  html = html.replace(/\n/g, '<br/>')

  return html
}
