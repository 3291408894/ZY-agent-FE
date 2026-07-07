/** 试卷生成 SSE 流式处理 composable */

import { ref, onUnmounted } from 'vue'
import type { SSEExamEvent } from '@/types'

export interface ExamSSECallbacks {
  onThinking?: (stage: string, message: string) => void
  onContent?: (chunk: string) => void
  onProgress?: (stage: string, message: string) => void
  onDone?: (paperId: string, title: string) => void
  onError?: (message: string) => void
}

export function useExamPaperSSE() {
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  async function connect(
    fetchPromise: Promise<Response>,
    callbacks: ExamSSECallbacks = {},
  ) {
    disconnect()
    isStreaming.value = true
    error.value = null
    abortController = new AbortController()

    try {
      const response = await fetchPromise

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
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue
            try {
              const data = JSON.parse(jsonStr) as SSEExamEvent
              switch (data.type) {
                case 'thinking':
                  callbacks.onThinking?.(
                    (data as { stage: string }).stage,
                    (data as { message: string }).message,
                  )
                  break
                case 'content':
                  callbacks.onContent?.((data as { chunk: string }).chunk)
                  break
                case 'progress':
                  callbacks.onProgress?.(
                    (data as { stage: string }).stage,
                    (data as { message: string }).message,
                  )
                  break
                case 'done':
                  callbacks.onDone?.(
                    (data as { paper_id: string }).paper_id,
                    (data as { title: string }).title,
                  )
                  break
                case 'error':
                  const msg = (data as { message: string }).message || '未知错误'
                  error.value = msg
                  callbacks.onError?.(msg)
                  break
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err: unknown) {
      const errName = (err as { name?: string }).name
      if (errName === 'AbortError') return
      const msg = err instanceof Error ? err.message : '网络连接失败'
      error.value = msg
      callbacks.onError?.(msg)
    } finally {
      isStreaming.value = false
    }
  }

  function disconnect() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  onUnmounted(() => disconnect())

  return { isStreaming, error, connect, disconnect }
}
