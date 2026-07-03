// ================================================================
// 智翼 (ZhiYi) — SSE 流式响应组合式函数
// 用于 AI Agent、课文总结、习题生成等流式接口
// ================================================================

import { ref, type Ref } from 'vue'

/** SSE 事件数据 */
export interface SSEMessage {
  type: 'thought' | 'content' | 'done' | 'error' | 'progress' | 'exercise'
  [key: string]: any
}

/** SSE 连接选项 */
export interface SSEOptions {
  /** API 地址 */
  url: string
  /** 请求体 */
  body: object
  /** 接收到 thought 事件时的回调（PBI_12: 思考步骤可视化） */
  onThought?: (data: SSEMessage) => void
  /** 接收到 content 事件时的回调 */
  onContent?: (chunk: string) => void
  /** 接收到 done 事件时的回调 */
  onDone?: (data: SSEMessage) => void
  /** 接收到 error 事件时的回调 */
  onError?: (error: string) => void
  /** 接收到 progress 事件时的回调 */
  onProgress?: (data: SSEMessage) => void
}

export function useSSE() {
  const message = ref('')
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  const abortController = ref<AbortController | null>(null)

  /**
   * 建立 SSE 连接并持续接收数据
   */
  async function connect(options: SSEOptions) {
    isStreaming.value = true
    message.value = ''
    error.value = null

    const controller = new AbortController()
    abortController.value = controller

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${options.url}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(options.body),
          signal: controller.signal,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 按 SSE 协议解析: "data: {...}\n\n"
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 最后一个可能不完整

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: SSEMessage = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'thought':
                  // PBI_12: 思考步骤
                  options.onThought?.(data)
                  break
                case 'content':
                  // 追加到主内容区（打字机效果）
                  message.value += data.chunk || ''
                  options.onContent?.(data.chunk || '')
                  break
                case 'progress':
                  options.onProgress?.(data)
                  break
                case 'done':
                  options.onDone?.(data)
                  break
                case 'error':
                  error.value = data.message || '未知错误'
                  options.onError?.(data.message || '未知错误')
                  break
              }
            } catch {
              // 跳过无法解析的行
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        error.value = e.message || 'SSE 连接失败'
        options.onError?.(error.value!)
      }
    } finally {
      isStreaming.value = false
      abortController.value = null
    }
  }

  /** 主动断开 SSE 连接 */
  function disconnect() {
    abortController.value?.abort()
    abortController.value = null
    isStreaming.value = false
  }

  return {
    message,
    isStreaming,
    error,
    connect,
    disconnect,
  }
}
