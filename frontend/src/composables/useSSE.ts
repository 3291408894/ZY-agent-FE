/** SSE 流式响应处理 Composable（AI Agent / 课文总结 / 习题生成 通用） */

import { ref, onUnmounted } from 'vue'

export interface SSECallbacks {
  /** 接收到 content 类型事件 */
  onContent?: (chunk: string) => void
  /** 接收到 knowledge_points 类型事件 */
  onKnowledgePoints?: (points: { name: string; category: string }[]) => void
  /** 流式传输完成 */
  onDone?: (data: { summary_id?: string; session_id?: string; mode?: string; lesson_plan_id?: string; title?: string }) => void
  /** 出错 */
  onError?: (message: string) => void
}

export function useSSE() {
  const message = ref('')
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  /**
   * 连接到 SSE 端点
   * @param url 完整的 API URL
   * @param body 请求体（JSON）
   * @param callbacks 事件回调
   */
  async function connect(
    url: string,
    body: Record<string, unknown>,
    callbacks: SSECallbacks = {},
  ) {
    // 取消之前的连接
    disconnect()

    isStreaming.value = true
    message.value = ''
    error.value = null
    abortController = new AbortController()

    const token = localStorage.getItem('access_token')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = (errData as { message?: string }).message || `请求失败 (${response.status})`
        error.value = msg
        callbacks.onError?.(msg)
        isStreaming.value = false
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 按行解析 SSE 格式: "data: {...}\n\n"
        const lines = buffer.split('\n')
        // 最后一个可能不完整，保留到下次
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const data = JSON.parse(jsonStr)

              switch (data.type) {
                case 'content':
                  message.value += data.chunk || ''
                  callbacks.onContent?.(data.chunk || '')
                  break
                case 'knowledge_points':
                  callbacks.onKnowledgePoints?.(data.points || [])
                  break
                case 'done':
                  callbacks.onDone?.(data)
                  break
                case 'error':
                  error.value = data.message || '未知错误'
                  callbacks.onError?.(data.message || '未知错误')
                  break
              }
            } catch {
              // 忽略 JSON 解析错误
            }
          }
        }
      }
    } catch (err: unknown) {
      // 兼容浏览器和 Node.js 测试环境：
      // - 浏览器：DOMException 不继承 Error，用 err.name 检测
      // - Node.js：可能是 Error 或 DOMException
      const errName = (err as { name?: string; code?: number })?.name
      if (errName === 'AbortError') {
        return  // 用户主动取消
      }
      const msg = err instanceof Error ? err.message : '网络连接失败'
      error.value = msg
      callbacks.onError?.(msg)
    } finally {
      isStreaming.value = false
    }
  }

  /** 取消当前 SSE 连接 */
  function disconnect() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  onUnmounted(() => {
    disconnect()
  })

  return { message, isStreaming, error, connect, disconnect }
}
