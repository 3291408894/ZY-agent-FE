<script setup lang="ts">
// ================================================================
// KnowledgeGraphCanvas — ECharts 5 知识图谱可视化组件 (PBI_11)
// 支持力导向布局、拖拽缩放、节点高亮、点击详情
// ================================================================

import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { IGraphNode, IGraphEdge } from '@/types'

interface Props {
  nodes: IGraphNode[]
  edges: IGraphEdge[]
  title?: string
  loading?: boolean
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  loading: false,
  height: '100%',
})

const emit = defineEmits<{
  (e: 'node-click', nodeId: string, node: IGraphNode): void
  (e: 'canvas-ready'): void
}>()

const chartContainer = ref<HTMLDivElement>()
const hoveredNodeId = ref<string | null>(null)
const isDark = ref(false)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

const NODE_COLORS: Record<string, string> = {
  category: '#5B9BD5',
  article: '#67C23A',
  knowledge: '#E6A23C',
}

const NODE_SIZES: Record<string, number> = {
  category: 48,
  article: 36,
  knowledge: 28,
}

const TYPE_LABELS: Record<string, string> = {
  category: '学科分类',
  article: '课文/文章',
  knowledge: '知识点',
}

// ── 主题相关 computed ──
function labelColor() { return isDark.value ? '#e0e0e0' : '#333' }
function edgeColor() { return isDark.value ? '#555' : '#c0c4cc' }
function edgeLabelColor() { return isDark.value ? '#888' : '#999' }
function bgColor() { return isDark.value ? '#252545' : '#fff' }
function tooltipBg() { return isDark.value ? '#2a2a50' : '#fff' }
function tooltipText() { return isDark.value ? '#e0e0e0' : '#333' }
function legendTextColor() { return isDark.value ? '#b0b0b0' : '#333' }
function borderColor() { return isDark.value ? '#444' : '#fff' }

function buildOption(): EChartsOption {
  const data = props.nodes.map((node) => ({
    id: node.id,
    name: node.label,
    symbolSize: NODE_SIZES[node.type] || 28,
    x: node.x || undefined,
    y: node.y || undefined,
    itemStyle: {
      color: NODE_COLORS[node.type] || NODE_COLORS.knowledge,
      borderColor: borderColor(),
      borderWidth: 2,
      shadowBlur: hoveredNodeId.value === node.id ? 16 : 4,
      shadowColor: hoveredNodeId.value === node.id
        ? 'rgba(91,155,213,0.5)'
        : isDark.value ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
    },
    label: {
      show: true,
      fontSize: 11,
      fontWeight: 500,
      color: labelColor(),
      formatter: (p: any) => {
        const label = p.name || ''
        return label.length > 6 ? label.slice(0, 5) + '...' : label
      },
    },
    category: node.type,
  }))

  const links = props.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    label: { show: true, formatter: edge.relation, fontSize: 10, color: edgeLabelColor() },
    lineStyle: { color: edgeColor(), curveness: 0.2, width: 1.5 },
  }))

  const categories = [
    { name: 'category', itemStyle: { color: NODE_COLORS.category } },
    { name: 'article', itemStyle: { color: NODE_COLORS.article } },
    { name: 'knowledge', itemStyle: { color: NODE_COLORS.knowledge } },
  ]

  return {
    backgroundColor: bgColor(),
    tooltip: {
      show: true,
      backgroundColor: tooltipBg(),
      borderColor: isDark.value ? '#555' : '#e4e7ed',
      textStyle: { color: tooltipText(), fontSize: 12 },
      formatter: (p: any) => {
        if (p.dataType === 'node') {
          return '<strong>' + p.name + '</strong><br/>' +
            '类型：' + (TYPE_LABELS[p.data.category] || p.data.category)
        }
        if (p.dataType === 'edge') return p.data.label?.formatter || ''
        return ''
      },
    },
    legend: {
      show: true,
      bottom: 8,
      left: 'center',
      textStyle: { color: legendTextColor(), fontSize: 12 },
      data: categories.map((c) => ({ name: c.name, icon: 'circle', textStyle: { fontSize: 12 } })),
      formatter: (name: string) => TYPE_LABELS[name] || name,
    },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      data,
      links,
      categories,
      force: { repulsion: 300, edgeLength: [100, 280], gravity: 0.12, friction: 0.6, layoutAnimation: true },
      emphasis: {
        focus: 'adjacency',
        itemStyle: { borderColor: '#5B9BD5', borderWidth: 3, shadowBlur: 20, shadowColor: 'rgba(91,155,213,0.5)' },
        lineStyle: { width: 3 },
      },
      edgeSymbol: ['none', 'none'],
      zoom: 1,
      scaleLimit: { min: 0.3, max: 5 },
      animationDuration: 800,
      animationEasing: 'cubicOut',
    }],
  }
}

/** 检测 dark 模式 */
function detectDark(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

function renderChart() {
  if (!chartContainer.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value, isDark.value ? 'dark' : undefined, {
      devicePixelRatio: window.devicePixelRatio || 1,
    })
    chartInstance.on('finished', () => emit('canvas-ready'))
  }
  chartInstance.setOption(buildOption(), { notMerge: true })
}

/** 主题变化时重建图表实例（ECharts 的 dark 主题需在 init 时指定） */
function handleThemeChange() {
  const newDark = detectDark()
  if (newDark === isDark.value && chartInstance) return
  isDark.value = newDark
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  nextTick(renderChart)
}

function bindEvents() {
  if (!chartInstance) return
  chartInstance.off('click')
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      const node = props.nodes.find((n) => n.id === params.data?.id)
      if (node) emit('node-click', params.data.id, node)
    }
  })
  chartInstance.off('mouseover')
  chartInstance.on('mouseover', (params: any) => {
    if (params.dataType === 'node') hoveredNodeId.value = params.data?.id || null
  })
  chartInstance.off('mouseout')
  chartInstance.on('mouseout', () => { hoveredNodeId.value = null })
}

function resize() { chartInstance?.resize() }

function exportAsImage(): string | null {
  if (!chartInstance) return null
  return chartInstance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
}

function highlightNode(nodeId: string) {
  if (!chartInstance) return
  chartInstance.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: props.nodes.findIndex((n) => n.id === nodeId) })
}

function downplayAll() {
  chartInstance?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
}

watch(() => [props.nodes, props.edges], () => nextTick(renderChart), { deep: true })

watch(() => props.loading, (val) => {
  if (val) chartInstance?.showLoading({ text: '加载中...', color: '#5B9BD5', maskColor: 'rgba(255,255,255,0.6)' })
  else chartInstance?.hideLoading()
})

onMounted(() => {
  // 初始化暗色模式检测
  isDark.value = detectDark()

  nextTick(() => {
    renderChart()
    bindEvents()
    resizeObserver = new ResizeObserver(() => resize())
    if (chartContainer.value) resizeObserver.observe(chartContainer.value)

    // 监听 data-theme 属性变化 → 重建图表
    themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') handleThemeChange()
      }
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  themeObserver?.disconnect()
  themeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})

defineExpose({ resize, exportAsImage, highlightNode, downplayAll })
</script>

<template>
  <div
    class="kg-canvas"
    :style="{ height: typeof height === 'number' ? height + 'px' : height }"
  >
    <!-- 加载遮罩 -->
    <div v-if="loading" class="kg-canvas__loading-overlay">
      <el-icon class="kg-canvas__loading-icon is-loading" :size="32">
        <Loading />
      </el-icon>
      <span>正在构建知识图谱...</span>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && nodes.length === 0" class="kg-canvas__empty">
      <div class="empty-state-icon">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="20" cy="20" r="6" fill="var(--color-primary)" opacity="0.4" />
          <circle cx="44" cy="16" r="8" fill="var(--color-primary)" opacity="0.3" />
          <circle cx="32" cy="40" r="10" fill="var(--color-success)" opacity="0.3" />
          <circle cx="52" cy="44" r="5" fill="var(--color-warning)" opacity="0.3" />
          <line x1="20" y1="20" x2="32" y2="40" stroke="var(--color-border)" stroke-width="1.5" />
          <line x1="44" y1="16" x2="32" y2="40" stroke="var(--color-border)" stroke-width="1.5" />
          <line x1="32" y1="40" x2="52" y2="44" stroke="var(--color-border)" stroke-width="1.5" />
        </svg>
      </div>
      <p class="empty-state-text">选择学科或知识领域，生成你的知识图谱</p>
      <p class="empty-state-hint">AI 将自动分析知识点关联，构建可视化结构</p>
    </div>

    <!-- ECharts 容器 -->
    <div
      ref="chartContainer"
      class="kg-canvas__chart"
      :style="{ opacity: nodes.length === 0 ? 0 : 1 }"
    />
  </div>
</template>

<style lang="scss" scoped>
.kg-canvas {
  position: relative;
  min-height: 400px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &__chart {
    width: 100%;
    height: 100%;
    transition: opacity 0.3s ease;
  }

  &__loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-base);
    background: var(--color-bg-card);
    opacity: 0.92;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
  }

  &__loading-icon {
    color: var(--color-primary);
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);

    .empty-state-icon {
      margin-bottom: var(--spacing-base);
      opacity: 0.6;
    }

    .empty-state-text {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }

    .empty-state-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-placeholder);
    }
  }
}
</style>
