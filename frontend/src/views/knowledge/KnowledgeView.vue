<script setup lang="ts">
// ================================================================
// KnowledgeView — 知识图谱页面 (PBI_11)
// 对应后端 /api/v1/knowledge/* 接口
// 功能：图谱生成、列表浏览、力导向可视化、节点详情、导出
// 支持 Mock 模式：设置 VITE_USE_MOCK=true 后无需后端即可测试
// ================================================================

import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useKnowledge } from '@/composables/useKnowledge'
import type { IGraphNode, IKnowledgeNode } from '@/types'
import KnowledgeGraphCanvas from './components/KnowledgeGraphCanvas.vue'

// ── 知识图谱服务（自动切换真实 API / Mock） ──
const {
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
} = useKnowledge()

// ── Mock 模式标识 ──
const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'

// ── 生成表单 ──
const showGenerateForm = ref(false)
const generatingSourceType = ref<'subject' | 'chapter' | 'file'>('subject')
const generatingSource = ref('')
const generatingFileId = ref<string | null>(null)

const sourceTypeOptions = [
  { label: '按学科', value: 'subject' },
  { label: '按章节', value: 'chapter' },
  { label: '从文件', value: 'file' },
]

const subjectPresets = [
  '语文-七年级-文言文',
  '语文-七年级-古诗词',
  '语文-八年级-文言文',
  '数学-七年级-代数',
  '数学-七年级-几何',
  '英语-七年级-语法',
  '数学-八年级-函数',
  '物理-八年级-力学',
]

// ── 节点详情 Drawer ──
const nodeDrawerVisible = ref(false)
const selectedNode = ref<IGraphNode | null>(null)
const nodeDetail = ref<IKnowledgeNode | null>(null)
const nodeDetailLoading = ref(false)
const nodeDetailError = ref('')

// ── 图谱画布引用 ──
const canvasRef = ref<InstanceType<typeof KnowledgeGraphCanvas>>()

// ── 计算属性 ──
const hasCurrentGraph = computed(() => currentGraph.value !== null)
const graphNodeCount = computed(() => currentGraph.value?.nodes.length ?? 0)
const graphEdgeCount = computed(() => currentGraph.value?.edges.length ?? 0)

// ── 生成图谱 ──
async function handleGenerate() {
  if (!generatingSource.value.trim()) {
    ElMessage.warning('请输入学科或知识点')
    return
  }
  try {
    await generate({
      source_type: generatingSourceType.value,
      source: generatingSource.value.trim(),
      file_id: generatingFileId.value,
    })
    showGenerateForm.value = false
    generatingSource.value = ''
    ElMessage.success(isMockMode ? '知识图谱生成成功！（Mock 数据）' : '知识图谱生成成功！')
  } catch (e: any) {
    // 错误已由 composable 处理
  }
}

// ── 删除图谱 ──
async function handleDelete(graphId: string, title: string) {
  try {
    await ElMessageBox.confirm(
      `确定要删除图谱「${title}」吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning',
      }
    )
    await removeGraph(graphId)
    ElMessage.success('图谱已删除')
  } catch (e: any) {
    if (e !== 'cancel' && e !== 'close') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}

// ── 导出图谱 ──
async function handleExport() {
  if (!currentGraph.value) return
  try {
    const dataUrl = canvasRef.value?.exportAsImage()
    if (dataUrl) {
      const link = document.createElement('a')
      link.download = `${currentGraph.value.title || '知识图谱'}.png`
      link.href = dataUrl
      link.click()
      ElMessage.success('导出成功')
      return
    }
    const url = await exportCurrentGraph(currentGraph.value.graph_id)
    if (url) window.open(url, '_blank')
    ElMessage.success('导出成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

// ── 节点点击 → 打开详情 ──
async function handleNodeClick(nodeId: string, node: IGraphNode) {
  selectedNode.value = node
  nodeDetail.value = null
  nodeDetailLoading.value = true
  nodeDetailError.value = ''
  nodeDrawerVisible.value = true

  try {
    if (currentGraph.value) {
      nodeDetail.value = await fetchNodeDetail(currentGraph.value.graph_id, nodeId, node)
    }
  } catch (e: any) {
    nodeDetailError.value = e?.message || '加载节点详情失败'
  } finally {
    nodeDetailLoading.value = false
  }
}

// ── 关联节点点击 → 跳转到该节点 ──
async function handleRelatedNodeClick(relatedNode: { id: string; label: string; relation: string }) {
  if (!currentGraph.value || !relatedNode.id) return
  // 在图中找到对应节点并触发详情
  const node = currentGraph.value.nodes.find((n) => n.id === relatedNode.id)
  if (node) {
    await handleNodeClick(relatedNode.id, node)
    canvasRef.value?.highlightNode(relatedNode.id)
  }
}

// ── 关闭节点详情 ──
function handleNodeDrawerClose() {
  nodeDrawerVisible.value = false
  selectedNode.value = null
  nodeDetail.value = null
  canvasRef.value?.downplayAll()
}

// ── 选择预设 ──
function selectPreset(preset: string) {
  generatingSource.value = preset
}

// ── 初始化 ──
onMounted(() => {
  fetchGraphList()
})
</script>

<template>
  <div class="knowledge-page">
    <!-- ═══ 页面标题 ═══ -->
    <div class="page-header">
      <div>
        <h1 class="page-header__title">知识图谱</h1>
        <p class="page-header__subtitle">可视化知识结构，点击节点查看详情，拖拽探索知识关联</p>
      </div>
      <div class="page-header__actions">
        <el-tag v-if="isMockMode" type="warning" size="small" effect="light">
          Mock 模式
        </el-tag>
        <el-button
          v-if="hasCurrentGraph"
          :icon="Download"
          size="default"
          @click="handleExport"
        >
          导出图片
        </el-button>
        <el-button
          v-if="!showGenerateForm"
          type="primary"
          :icon="Plus"
          @click="showGenerateForm = true"
        >
          生成图谱
        </el-button>
      </div>
    </div>

    <!-- ═══ 主内容区：侧边栏 + 画布 ═══ -->
    <div class="knowledge-layout">
      <!-- ── 左侧边栏 ── -->
      <aside class="knowledge-sidebar">
        <!-- 生成面板 -->
        <transition name="slide">
          <div v-if="showGenerateForm" class="generate-panel card">
            <div class="generate-panel__header">
              <h3>新建知识图谱</h3>
              <el-button
                text
                :icon="Delete"
                size="small"
                @click="showGenerateForm = false"
              />
            </div>

            <el-form label-position="top" @submit.prevent="handleGenerate">
              <!-- 来源类型 -->
              <el-form-item label="来源类型">
                <el-radio-group v-model="generatingSourceType" size="small">
                  <el-radio-button
                    v-for="opt in sourceTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>

              <!-- 来源内容 -->
              <el-form-item label="学科 / 知识点">
                <el-input
                  v-model="generatingSource"
                  placeholder="例如：语文-七年级-文言文"
                  :prefix-icon="Search"
                  clearable
                />
              </el-form-item>

              <!-- 预设快捷选择 -->
              <div class="generate-panel__presets">
                <span class="presets-label">快速选择：</span>
                <el-tag
                  v-for="preset in subjectPresets"
                  :key="preset"
                  class="preset-tag"
                  :type="generatingSource === preset ? 'primary' : 'info'"
                  size="small"
                  @click="selectPreset(preset)"
                >
                  {{ preset }}
                </el-tag>
              </div>

              <el-button
                type="primary"
                :loading="isGenerating"
                :disabled="!generatingSource.trim()"
                native-type="submit"
                style="width: 100%"
                @click="handleGenerate"
              >
                {{ isGenerating ? 'AI 正在分析构建...' : '开始生成' }}
              </el-button>
            </el-form>
          </div>
        </transition>

        <!-- 图谱历史列表 -->
        <div class="history-section">
          <div class="history-section__header">
            <h3>历史图谱</h3>
            <el-button text :icon="Refresh" size="small" @click="fetchGraphList" />
          </div>

          <!-- 加载中 -->
          <div v-if="listLoading" class="history-loading">
            <el-skeleton :rows="3" animated />
          </div>

          <!-- 加载错误 -->
          <div v-else-if="listError" class="history-error">
            <el-alert
              :title="listError"
              type="warning"
              show-icon
              :closable="true"
              @close="listError = ''"
            />
            <el-button size="small" text type="primary" @click="fetchGraphList">
              重试
            </el-button>
          </div>

          <!-- 空列表 -->
          <div v-else-if="graphList.length === 0" class="history-empty">
            <el-icon :size="32" color="var(--color-text-placeholder)">
              <Search />
            </el-icon>
            <p>暂无知识图谱</p>
            <span>点击上方「生成图谱」创建你的第一张知识图谱</span>
          </div>

          <!-- 列表项 -->
          <div v-else class="history-list">
            <button
              v-for="item in graphList"
              :key="item.id"
              class="history-item"
              :class="{
                'history-item--active': currentGraph?.graph_id === item.id,
              }"
              @click="loadGraph(item.id)"
            >
              <div class="history-item__info">
                <span class="history-item__title">{{ item.title }}</span>
                <span class="history-item__meta">
                  <el-tag size="small" type="info">{{ item.source_type }}</el-tag>
                  <span>{{ new Date(item.created_at).toLocaleDateString() }}</span>
                </span>
              </div>
              <el-button
                text
                :icon="Delete"
                size="small"
                class="history-item__delete"
                @click.stop="handleDelete(item.id, item.title)"
              />
            </button>
          </div>
        </div>
      </aside>

      <!-- ── 右侧画布 ── -->
      <main class="knowledge-main">
        <!-- 图谱信息栏 -->
        <transition name="fade">
          <div v-if="hasCurrentGraph && !graphLoading" class="graph-info-bar">
            <div class="graph-info-bar__title">
              <el-icon :size="18"><Share /></el-icon>
              <h2>{{ currentGraph?.title }}</h2>
            </div>
            <div class="graph-info-bar__stats">
              <el-tag size="small" effect="plain">
                {{ graphNodeCount }} 个节点
              </el-tag>
              <el-tag size="small" effect="plain">
                {{ graphEdgeCount }} 条关系
              </el-tag>
              <el-tag
                v-if="currentGraph?.source_type"
                size="small"
                effect="plain"
              >
                {{ currentGraph?.source_type }}
              </el-tag>
            </div>
          </div>
        </transition>

        <!-- 图谱错误 -->
        <el-alert
          v-if="graphError"
          :title="graphError"
          type="error"
          show-icon
          :closable="true"
          class="graph-error"
          @close="graphError = ''"
        />

        <!-- 图谱画布 -->
        <KnowledgeGraphCanvas
          ref="canvasRef"
          :nodes="currentGraph?.nodes || []"
          :edges="currentGraph?.edges || []"
          :title="currentGraph?.title || ''"
          :loading="graphLoading"
          height="100%"
          @node-click="handleNodeClick"
          @canvas-ready=""
        />
      </main>
    </div>

    <!-- ═══ 节点详情抽屉 ═══ -->
    <el-drawer
      v-model="nodeDrawerVisible"
      :title="selectedNode?.label || '节点详情'"
      direction="rtl"
      size="400px"
      @close="handleNodeDrawerClose"
    >
      <!-- 加载中 -->
      <div v-if="nodeDetailLoading" class="node-detail__loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 加载错误 -->
      <el-alert
        v-else-if="nodeDetailError"
        :title="nodeDetailError"
        type="warning"
        show-icon
        :closable="false"
      />

      <!-- 详情内容 -->
      <template v-else-if="nodeDetail">
        <!-- 节点元信息 -->
        <div class="node-detail__section">
          <div class="node-detail__meta">
            <el-tag
              :type="
                selectedNode?.type === 'category'
                  ? 'primary'
                  : selectedNode?.type === 'article'
                    ? 'success'
                    : 'warning'
              "
              size="small"
            >
              {{
                selectedNode?.type === 'category'
                  ? '学科分类'
                  : selectedNode?.type === 'article'
                    ? '课文/文章'
                    : '知识点'
              }}
            </el-tag>
            <span class="node-detail__label">{{ selectedNode?.label }}</span>
          </div>
          <p v-if="nodeDetail.description" class="node-detail__desc">
            {{ nodeDetail.description }}
          </p>
          <p v-else class="node-detail__desc node-detail__desc--empty">
            暂无详细描述
          </p>
        </div>

        <!-- 例题 -->
        <div
          v-if="nodeDetail.examples && nodeDetail.examples.length > 0"
          class="node-detail__section"
        >
          <h4>相关例题</h4>
          <ul class="example-list">
            <li v-for="(example, idx) in nodeDetail.examples" :key="idx">
              {{ example }}
            </li>
          </ul>
        </div>

        <!-- 常见错误 -->
        <div
          v-if="nodeDetail.common_mistakes && nodeDetail.common_mistakes.length > 0"
          class="node-detail__section"
        >
          <h4>常见错误</h4>
          <ul class="mistake-list">
            <li v-for="(mistake, idx) in nodeDetail.common_mistakes" :key="idx">
              <el-icon color="var(--color-danger)" :size="14">
                <WarningFilled />
              </el-icon>
              {{ mistake }}
            </li>
          </ul>
        </div>

        <!-- 关联节点 -->
        <div
          v-if="nodeDetail.related_nodes && nodeDetail.related_nodes.length > 0"
          class="node-detail__section"
        >
          <h4>关联知识点</h4>
          <div class="related-nodes">
            <button
              v-for="rel in nodeDetail.related_nodes"
              :key="rel.id"
              class="related-node-item"
              @click="handleRelatedNodeClick(rel)"
            >
              <el-tag size="small" effect="plain">{{ rel.relation }}</el-tag>
              <span>{{ rel.label }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 未选择节点 -->
      <div v-else class="node-detail__empty">
        <el-icon :size="32" color="var(--color-text-placeholder)">
          <InfoFilled />
        </el-icon>
        <p>点击图谱中的节点查看详情</p>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
// ══════════════════════════════════════════════
// 整体布局
// ══════════════════════════════════════════════
.knowledge-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);
  min-height: 600px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);

  &__title {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }
}

.knowledge-layout {
  flex: 1;
  display: flex;
  gap: var(--spacing-lg);
  min-height: 0;
  overflow: hidden;
}

// ══════════════════════════════════════════════
// 左侧边栏
// ══════════════════════════════════════════════
.knowledge-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
  overflow-y: auto;
}

// ── 生成面板 ──
.generate-panel {
  padding: var(--spacing-lg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);

    h3 {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__presets {
    margin-bottom: var(--spacing-base);

    .presets-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-placeholder);
      display: block;
      margin-bottom: var(--spacing-xs);
    }

    .preset-tag {
      margin: 2px 2px;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

// ── 历史列表 ──
.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
    flex-shrink: 0;

    h3 {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.history-loading {
  padding: var(--spacing-base);
}

.history-error {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: flex-start;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xl) var(--spacing-base);
  text-align: center;

  p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  span {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  width: 100%;
  border: 1px solid transparent;

  &:hover {
    background: var(--color-primary-lighter);
    border-color: var(--color-primary-light);
  }

  &--active {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
  }

  &__delete {
    opacity: 0;
    transition: opacity var(--transition-fast);
    flex-shrink: 0;
  }

  &:hover &__delete {
    opacity: 1;
  }
}

// ══════════════════════════════════════════════
// 右侧主画布区
// ══════════════════════════════════════════════
.knowledge-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
  min-height: 0;

  // 让画布填满剩余空间
  > :last-child {
    flex: 1;
    min-height: 0;
  }
}

.graph-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex-shrink: 0;

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);

    h2 {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
    }
  }

  &__stats {
    display: flex;
    gap: var(--spacing-xs);
  }
}

.graph-error {
  flex-shrink: 0;
}

// ══════════════════════════════════════════════
// 节点详情抽屉
// ══════════════════════════════════════════════
.node-detail {
  &__loading {
    padding: var(--spacing-xl);
  }

  &__section {
    margin-bottom: var(--spacing-xl);

    h4 {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
      padding-bottom: var(--spacing-xs);
      border-bottom: 1px solid var(--color-border-light);
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);
  }

  &__label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  &__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: 1.7;

    &--empty {
      color: var(--color-text-placeholder);
      font-style: italic;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xxxl) var(--spacing-xl);
    text-align: center;

    p {
      font-size: var(--font-size-sm);
      color: var(--color-text-placeholder);
    }
  }
}

// 例题列表
.example-list {
  list-style: none;
  padding: 0;

  li {
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-xs);
    background: var(--color-bg);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    line-height: 1.6;
    border-left: 3px solid var(--color-primary);
  }
}

// 常见错误列表
.mistake-list {
  list-style: none;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    margin-bottom: var(--spacing-xs);
    background: var(--color-danger-light);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    line-height: 1.6;
  }
}

// 关联节点
.related-nodes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.related-node-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  border: 1px solid transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-primary-lighter);
    border-color: var(--color-primary-light);
  }
}

// ══════════════════════════════════════════════
// 过渡动画
// ══════════════════════════════════════════════
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin-bottom: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ══════════════════════════════════════════════
// 响应式
// ══════════════════════════════════════════════
@media (max-width: 768px) {
  .knowledge-page {
    height: auto;
    min-height: auto;
  }

  .knowledge-layout {
    flex-direction: column;
  }

  .knowledge-sidebar {
    width: 100%;
    max-height: 40vh;
  }

  .page-header {
    flex-direction: column;
    gap: var(--spacing-sm);

    &__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>