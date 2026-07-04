// ================================================================
// 智翼 (ZhiYi) — 知识图谱 Mock 数据 & 服务层 (PBI_11)
// 用于无后端时的前端独立开发与测试
// 设置 VITE_USE_MOCK=true 使用 mock 数据，否则走真实 API
// ================================================================

import { ref, type Ref } from 'vue'
import {
  generateGraph as apiGenerateGraph,
  getGraphList as apiGetGraphList,
  getGraphDetail as apiGetGraphDetail,
  getNodeDetail as apiGetNodeDetail,
  deleteGraph as apiDeleteGraph,
  exportGraph as apiExportGraph,
} from '@/api/modules/knowledge'
import type {
  IKnowledgeGraph,
  IKnowledgeGraphItem,
  IKnowledgeNode,
  IGraphNode,
} from '@/types'

// ══════════════════════════════════════════════
// Mock 数据
// ══════════════════════════════════════════════

const MOCK_GRAPH_ID = 'mock-graph-001'

const MOCK_NODES: IGraphNode[] = [
  { id: 'n1', label: '文言文', type: 'category', x: 400, y: 50 },
  { id: 'n2', label: '桃花源记', type: 'article', x: 250, y: 200 },
  { id: 'n3', label: '岳阳楼记', type: 'article', x: 550, y: 200 },
  { id: 'n4', label: '醉翁亭记', type: 'article', x: 400, y: 320 },
  { id: 'n5', label: '实词', type: 'knowledge', x: 130, y: 380 },
  { id: 'n6', label: '虚词', type: 'knowledge', x: 280, y: 420 },
  { id: 'n7', label: '通假字', type: 'knowledge', x: 430, y: 460 },
  { id: 'n8', label: '古今异义', type: 'knowledge', x: 580, y: 400 },
  { id: 'n9', label: '词类活用', type: 'knowledge', x: 650, y: 280 },
  { id: 'n10', label: '特殊句式', type: 'knowledge', x: 320, y: 520 },
  { id: 'n11', label: '主旨理解', type: 'knowledge', x: 500, y: 360 },
  { id: 'n12', label: '写作手法', type: 'knowledge', x: 160, y: 280 },
]

const MOCK_EDGES = [
  { source: 'n1', target: 'n2', relation: '包含课文' },
  { source: 'n1', target: 'n3', relation: '包含课文' },
  { source: 'n1', target: 'n4', relation: '包含课文' },
  { source: 'n2', target: 'n5', relation: '重点考查' },
  { source: 'n2', target: 'n6', relation: '重点考查' },
  { source: 'n2', target: 'n7', relation: '涉及' },
  { source: 'n2', target: 'n12', relation: '考查' },
  { source: 'n3', target: 'n8', relation: '重点考查' },
  { source: 'n3', target: 'n9', relation: '涉及' },
  { source: 'n3', target: 'n11', relation: '核心考点' },
  { source: 'n4', target: 'n10', relation: '重点考查' },
  { source: 'n4', target: 'n6', relation: '涉及' },
  { source: 'n5', target: 'n8', relation: '对比记忆' },
  { source: 'n7', target: 'n8', relation: '易混淆' },
  { source: 'n11', target: 'n12', relation: '关联' },
]

const MOCK_GRAPH: IKnowledgeGraph = {
  graph_id: MOCK_GRAPH_ID,
  title: '七年级文言文知识图谱',
  source_type: 'subject',
  nodes: MOCK_NODES,
  edges: MOCK_EDGES,
}

const MOCK_GRAPH_LIST: IKnowledgeGraphItem[] = [
  { id: 'mock-graph-001', title: '七年级文言文知识图谱', source_type: 'subject', created_at: '2026-07-03T10:00:00Z' },
  { id: 'mock-graph-002', title: '八年级数学-函数专题', source_type: 'chapter', created_at: '2026-07-02T14:30:00Z' },
  { id: 'mock-graph-003', title: '英语七年级语法体系', source_type: 'subject', created_at: '2026-07-01T09:15:00Z' },
  { id: 'mock-graph-004', title: '物理力学基础概念', source_type: 'chapter', created_at: '2026-06-28T16:45:00Z' },
]

const MOCK_NODE_DETAILS: Record<string, IKnowledgeNode> = {
  n2: {
    node_id: 'n2',
    label: '桃花源记',
    description: '《桃花源记》是东晋文学家陶渊明的代表作之一，选自《陶渊明集》。文章借武陵渔人行踪这一线索，把现实和理想境界联系起来，通过对桃花源的安宁和乐、自由平等生活的描绘，表现了作者追求美好生活的理想和对现实社会的不满。',
    examples: [
      '解释下列加点词的意思：①缘溪行（沿着）②仿佛若有光（隐隐约约）③有良田美池桑竹之属（类）',
      '翻译：阡陌交通，鸡犬相闻。→ 田间小路交错相通，鸡鸣狗叫的声音可以互相听到。',
      '作者在文中描绘了怎样的社会图景？表达了怎样的思想感情？',
    ],
    common_mistakes: [
      '"便要还家"中"要"是通假字，通"邀"（邀请），不是"要求"的意思',
      '"率妻子邑人来此绝境"中"妻子"是古今异义词，古义是"妻子和儿女"，不是现代意义的"妻子"',
      '"无论魏晋"中"无论"是古今异义词，意为"不要说，更不必说"',
    ],
    related_nodes: [
      { id: 'n5', label: '实词', relation: '考查知识点' },
      { id: 'n6', label: '虚词', relation: '考查知识点' },
      { id: 'n7', label: '通假字', relation: '考查知识点' },
      { id: 'n12', label: '写作手法', relation: '考查知识点' },
    ],
  },
  n5: {
    node_id: 'n5',
    label: '实词',
    description: '实词是指有实在意义，能够单独充当句子成分，一般能单独回答问题的词语。在文言文中，实词包括名词、动词、形容词、数词、量词、代词六类。中考常考查一词多义、古今异义、词类活用等。',
    examples: [
      '下列加点词意思相同的一项是：A. 武陵人捕鱼为业 / 不足为外人道也  B. 便舍船 / 屋舍俨然',
      '解释"处处志之"中"志"的意思。→ 做标记（名词活用为动词）',
    ],
    common_mistakes: [
      '"阡陌交通"中"交通"是古今异义词，古义：交错相通；今义：各种运输事业的总称',
      '"率妻子邑人"中"妻子"是古今异义词，古义：妻子和儿女',
    ],
    related_nodes: [
      { id: 'n8', label: '古今异义', relation: '对比记忆' },
      { id: 'n9', label: '词类活用', relation: '易混淆' },
    ],
  },
}

// 为未定义的节点生成基本详情
function generateFallbackNodeDetail(node: IGraphNode): IKnowledgeNode {
  return {
    node_id: node.id,
    label: node.label,
    description: `${node.label}是${node.type === 'category' ? '一个学科知识大类' : node.type === 'article' ? '一篇重点学习课文' : '一个需要掌握的知识点'}，包含丰富的学习内容。`,
    examples: ['暂无例题，AI 正在整理中...'],
    common_mistakes: ['暂无常见错误记录'],
    related_nodes: [],
  }
}

// ══════════════════════════════════════════════
// 是否使用 Mock
// ══════════════════════════════════════════════

const useMock = (): boolean => {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

// 模拟网络延迟
function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400))
}

// ══════════════════════════════════════════════
// 对外暴露的组合式函数
// ══════════════════════════════════════════════

export function useKnowledge() {
  const graphList = ref<IKnowledgeGraphItem[]>([])
  const currentGraph = ref<IKnowledgeGraph | null>(null)
  const listLoading = ref(false)
  const graphLoading = ref(false)
  const isGenerating = ref(false)
  const listError = ref('')
  const graphError = ref('')

  // ── 获取图谱列表 ──
  async function fetchGraphList(): Promise<void> {
    listLoading.value = true
    listError.value = ''
    try {
      if (useMock()) {
        await delay()
        graphList.value = [...MOCK_GRAPH_LIST]
        return
      }
      const data = await apiGetGraphList({ page: 1, page_size: 50 })
      graphList.value = data.items || []
    } catch (e: any) {
      listError.value = e?.message || '加载图谱列表失败'
    } finally {
      listLoading.value = false
    }
  }

  // ── 加载图谱详情 ──
  async function loadGraph(graphId: string): Promise<void> {
    graphLoading.value = true
    graphError.value = ''
    try {
      if (useMock()) {
        await delay(400)
        if (graphId === MOCK_GRAPH_ID) {
          currentGraph.value = { ...MOCK_GRAPH, nodes: [...MOCK_NODES], edges: [...MOCK_EDGES] }
        } else {
          // 为其他 mock ID 生成变体
          const item = MOCK_GRAPH_LIST.find((g) => g.id === graphId)
          currentGraph.value = {
            graph_id: graphId,
            title: item?.title || '知识图谱',
            source_type: item?.source_type || 'subject',
            nodes: MOCK_NODES.slice(0, 8),
            edges: MOCK_EDGES.slice(0, 8),
          }
        }
        return
      }
      currentGraph.value = await apiGetGraphDetail(graphId)
    } catch (e: any) {
      graphError.value = e?.message || '加载图谱失败'
    } finally {
      graphLoading.value = false
    }
  }

  // ── 生成图谱 ──
  async function generate(params: {
    source_type: 'subject' | 'chapter' | 'file'
    source: string
    file_id?: string | null
  }): Promise<void> {
    isGenerating.value = true
    graphError.value = ''
    try {
      if (useMock()) {
        await delay(1500)
        currentGraph.value = {
          ...MOCK_GRAPH,
          graph_id: 'mock-graph-' + Date.now(),
          title: params.source + ' 知识图谱',
          source_type: params.source_type,
          nodes: [...MOCK_NODES],
          edges: [...MOCK_EDGES],
        }
        graphList.value.unshift({
          id: currentGraph.value.graph_id,
          title: currentGraph.value.title,
          source_type: params.source_type,
          created_at: new Date().toISOString(),
        })
        return
      }
      currentGraph.value = await apiGenerateGraph(params)
      fetchGraphList()
    } catch (e: any) {
      graphError.value = e?.message || '图谱生成失败'
    } finally {
      isGenerating.value = false
    }
  }

  // ── 删除图谱 ──
  async function removeGraph(graphId: string): Promise<void> {
    if (useMock()) {
      await delay(300)
      graphList.value = graphList.value.filter((g) => g.id !== graphId)
      if (currentGraph.value?.graph_id === graphId) currentGraph.value = null
      return
    }
    await apiDeleteGraph(graphId)
    if (currentGraph.value?.graph_id === graphId) currentGraph.value = null
    fetchGraphList()
  }

  // ── 获取节点详情 ──
  async function fetchNodeDetail(
    graphId: string,
    nodeId: string,
    node: IGraphNode
  ): Promise<IKnowledgeNode> {
    if (useMock()) {
      await delay(300)
      return MOCK_NODE_DETAILS[nodeId] || generateFallbackNodeDetail(node)
    }
    return apiGetNodeDetail(graphId, nodeId)
  }

  // ── 导出 ──
  async function exportCurrentGraph(graphId: string): Promise<string | null> {
    if (useMock()) {
      await delay(200)
      return null // mock 模式下走 ECharts 截图
    }
    const result = await apiExportGraph(graphId)
    return result?.url || null
  }

  return {
    graphList,
    currentGraph,
    listLoading,
    graphLoading,
    isGenerating,
    listError,
    graphError,
    fetchGraphList,
    loadGraph,
    generate,
    removeGraph,
    fetchNodeDetail,
    exportCurrentGraph,
  }
}
