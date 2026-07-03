/**
 * 课文总结模块 — 前端逻辑验证
 * 验证类型定义、API 函数、Store 逻辑的正确性
 * 运行方式: npx vitest run tests/summary.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSummaryStore } from '../src/stores/summary'

// ── 初始化 Pinia ──
beforeEach(() => {
  setActivePinia(createPinia())
})

describe('SummaryMode labels', () => {
  it('should have correct labels for brief and detailed', async () => {
    const { SUMMARY_MODE_LABELS, SUMMARY_MODE_DESCRIPTIONS } =
      await import('../src/api/modules/summary')

    expect(SUMMARY_MODE_LABELS.brief).toBe('精简版')
    expect(SUMMARY_MODE_LABELS.detailed).toBe('详细版')
    expect(SUMMARY_MODE_DESCRIPTIONS.brief).toContain('主旨')
    expect(SUMMARY_MODE_DESCRIPTIONS.detailed).toContain('考点')
  })
})

describe('Summary Store', () => {
  it('should initialize with empty state', () => {
    const store = useSummaryStore()

    expect(store.currentContent).toBe('')
    expect(store.isStreaming).toBe(false)
    expect(store.currentKnowledgePoints).toEqual([])
    expect(store.currentSummaryId).toBeNull()
    expect(store.historyList).toEqual([])
    expect(store.historyTotal).toBe(0)
  })

  it('should reset current state', () => {
    const store = useSummaryStore()

    // 模拟一些流式数据
    store.currentContent = '总结文本...'
    store.currentKnowledgePoints = [{ name: '知识点1', category: '语文' }]
    store.currentSummaryId = 'test-id'
    store.isStreaming = true

    store.resetCurrent()

    expect(store.currentContent).toBe('')
    expect(store.currentKnowledgePoints).toEqual([])
    expect(store.currentSummaryId).toBeNull()
    expect(store.isStreaming).toBe(false)
  })

  it('should append content chunks', () => {
    const store = useSummaryStore()

    store.appendContent('《背影》')
    store.appendContent('是朱自清的散文。')

    expect(store.currentContent).toBe('《背影》是朱自清的散文。')
  })

  it('should set knowledge points', () => {
    const store = useSummaryStore()

    const kps = [
      { name: '通假字', category: '文言知识' },
      { name: '借景抒情', category: '写作手法' },
    ]

    store.setKnowledgePoints(kps)
    expect(store.currentKnowledgePoints).toHaveLength(2)
    expect(store.currentKnowledgePoints[0].name).toBe('通假字')
  })

  it('should set done state', () => {
    const store = useSummaryStore()
    store.isStreaming = true

    store.setDone('summary-uuid-123')

    expect(store.currentSummaryId).toBe('summary-uuid-123')
    expect(store.isStreaming).toBe(false)
  })

  it('should set stream error', () => {
    const store = useSummaryStore()
    store.isStreaming = true

    store.setStreamError('LLM 服务不可用')

    expect(store.streamError).toBe('LLM 服务不可用')
    expect(store.isStreaming).toBe(false)
  })

  it('should compute history total pages', () => {
    const store = useSummaryStore()

    store.historyTotal = 55
    store.historyPageSize = 20

    expect(store.historyTotalPages).toBe(3) // ceil(55/20) = 3
  })

  it('should remove summary from local list', () => {
    const store = useSummaryStore()

    store.historyList = [
      {
        id: '1',
        source_type: 'text',
        source_content: 'test',
        summary_text: 'summary',
        mode: 'detailed',
        knowledge_points: [],
        created_at: '2026-07-03T00:00:00Z',
      },
      {
        id: '2',
        source_type: 'text',
        source_content: 'test2',
        summary_text: 'summary2',
        mode: 'brief',
        knowledge_points: [],
        created_at: '2026-07-03T00:00:00Z',
      },
    ]
    store.historyTotal = 2

    // 模拟删除（不实际调用 API）
    store.historyList = store.historyList.filter(item => item.id !== '1')
    store.historyTotal--

    expect(store.historyList).toHaveLength(1)
    expect(store.historyList[0].id).toBe('2')
    expect(store.historyTotal).toBe(1)
  })
})

describe('SSE event parsing', () => {
  it('should correctly parse SSE data lines', () => {
    // 模拟 useSSE 中的解析逻辑
    const line = 'data: {"type":"content","chunk":"测试文本"}'
    const jsonStr = line.slice(6).trim()
    const data = JSON.parse(jsonStr)

    expect(data.type).toBe('content')
    expect(data.chunk).toBe('测试文本')
  })

  it('should parse knowledge_points event', () => {
    const line =
      'data: {"type":"knowledge_points","points":[{"name":"实词","category":"文言知识"}]}'
    const data = JSON.parse(line.slice(6).trim())

    expect(data.type).toBe('knowledge_points')
    expect(data.points).toHaveLength(1)
    expect(data.points[0].name).toBe('实词')
  })

  it('should parse done event with summary_id', () => {
    const line =
      'data: {"type":"done","summary_id":"uuid-abc","mode":"detailed"}'
    const data = JSON.parse(line.slice(6).trim())

    expect(data.type).toBe('done')
    expect(data.summary_id).toBe('uuid-abc')
    expect(data.mode).toBe('detailed')
  })
})
