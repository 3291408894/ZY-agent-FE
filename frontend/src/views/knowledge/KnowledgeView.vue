<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useKnowledge } from '@/composables/useKnowledge'
import { getFileList } from '@/api/modules/file'
import KnowledgeGraphCanvas from './components/KnowledgeGraphCanvas.vue'
import type { IGraphNode, IKnowledgeNode, IUploadedFile } from '@/types'

const {
  graphList, currentGraph, listLoading, graphLoading, isGenerating,
  listError, graphError, fetchGraphList, loadGraph, generate, removeGraph, fetchNodeDetail, exportCurrentGraph,
} = useKnowledge()

const sourceType = ref<'subject' | 'chapter' | 'file'>('subject')
const sourceInput = ref('')
const selectedFileId = ref<string | null>(null)
const fileList = ref<IUploadedFile[]>([])
const fileLoading = ref(false)
const nodeDetail = ref<IKnowledgeNode | null>(null)
const detailVisible = ref(false)

const PRESETS = [
  { label: '七年级文言文', type: 'subject' as const, value: '语文-七年级-文言文' },
  { label: '八年级数学函数', type: 'chapter' as const, value: '数学-八年级-函数' },
  { label: '英语基础语法', type: 'subject' as const, value: '英语-七年级-语法' },
  { label: '物理力学', type: 'chapter' as const, value: '物理-八年级-力学' },
  { label: '化学反应', type: 'chapter' as const, value: '化学-九年级-化学反应' },
  { label: '中国近代史', type: 'subject' as const, value: '历史-八年级-近代史' },
]

onMounted(() => { fetchGraphList() })

/** 加载文件列表供下拉选择 */
async function loadFileList() {
  fileLoading.value = true
  try {
    const res = await getFileList(1, 100)
    fileList.value = (res?.items || []).filter(f => f.parse_status === 'done')
  } catch { fileList.value = [] }
  finally { fileLoading.value = false }
}

/** 切换 sourceType 时自动加载文件列表 */
watch(sourceType, (t) => { if (t === 'file') loadFileList() })

async function handleGenerate() {
  const params: { source_type: 'subject' | 'chapter' | 'file'; source: string; file_id?: string | null } = {
    source_type: sourceType.value,
    source: sourceType.value === 'file' ? (selectedFileId.value || '') : sourceInput.value,
    file_id: sourceType.value === 'file' ? selectedFileId.value : null,
  }
  try { await generate(params) }
  catch (e: any) { ElMessage.error(e.message || '生成失败') }
}

async function handleSelect(id: string) {
  try { nodeDetail.value = null; detailVisible.value = false; await loadGraph(id) }
  catch (e: any) { ElMessage.error(e.message || '加载失败') }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该图谱吗？', '确认', { type: 'warning' })
    await removeGraph(id)
  } catch { /* cancelled */ }
}

async function handleNodeClick(nodeId: string, node: IGraphNode) {
  try {
    detailVisible.value = true
    const gid = currentGraph.value?.graph_id
    if (!gid) return
    nodeDetail.value = await fetchNodeDetail(gid, nodeId, node)
  } catch { ElMessage.error('加载节点详情失败') }
}

async function handleExport() {
  const gid = currentGraph.value?.graph_id
  if (!gid) { ElMessage.error('没有可导出的图谱'); return }
  try { await exportCurrentGraph(gid); ElMessage.success('导出成功') }
  catch { ElMessage.error('导出失败') }
}
</script>

<template>
  <div class="knowledge-page" style="display:flex;gap:var(--spacing-base);height:calc(100vh - var(--header-height) - var(--footer-height) - var(--page-padding) * 2);min-height:550px">
    <!-- 侧边栏 -->
    <aside class="knowledge-sidebar">
      <h3>知识图谱</h3>
      <!-- 生成 -->
      <div style="margin-bottom:var(--spacing-base)">
        <el-select v-model="sourceType" size="small" style="width:100%;margin-bottom:var(--spacing-xs)"><el-option label="学科" value="subject" /><el-option label="章节" value="chapter" /><el-option label="文件" value="file" /></el-select>
        <!-- 文件模式：下拉选择已上传的文件 -->
        <el-select
          v-if="sourceType === 'file'"
          v-model="selectedFileId"
          placeholder="选择文件..."
          size="small"
          filterable
          clearable
          style="width:100%;margin-bottom:var(--spacing-xs)"
          :loading="fileLoading"
        >
          <el-option
            v-for="f in fileList"
            :key="f.id"
            :label="f.filename"
            :value="f.id"
          >
            <div style="display:flex;flex-direction:column;gap:2px">
              <span style="font-size:var(--font-size-sm)">{{ f.filename }}</span>
              <span style="font-size:var(--font-size-xs);color:var(--color-text-placeholder)">{{ f.parse_status === 'done' ? '✅ 已解析' : f.parse_status }}</span>
            </div>
          </el-option>
        </el-select>
        <!-- 文本模式：手工输入 -->
        <el-input v-else v-model="sourceInput" placeholder="输入学科/章节..." size="small" style="margin-bottom:var(--spacing-xs)" />
        <el-button type="primary" size="small" :loading="isGenerating" @click="handleGenerate" style="width:100%">生成图谱</el-button>
      </div>

      <!-- 预设 -->
      <div class="preset-list">
        <el-button v-for="p in PRESETS" :key="p.value" size="small" text style="display:block;width:100%;text-align:left;margin-bottom:2px" @click="sourceType = p.type; sourceInput = p.value; selectedFileId = null; handleGenerate()">
          {{ p.label }}
        </el-button>
      </div>

      <!-- 历史列表 -->
      <div style="margin-top:var(--spacing-base);flex:1;overflow-y:auto" v-loading="listLoading">
        <div v-for="g in graphList" :key="g.id" class="history-item" :class="{ active: currentGraph?.graph_id === g.id }" @click="handleSelect(g.id)">
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ g.title }}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-placeholder)">{{ g.node_count }} 节点 · {{ g.edge_count }} 边</div>
          </div>
          <el-button link type="danger" size="small" @click.stop="handleDelete(g.id)"><el-icon><Delete /></el-icon></el-button>
        </div>
      </div>
    </aside>

    <!-- 画布区 -->
    <main class="knowledge-main">
      <div v-if="!currentGraph" class="empty-state" style="height:100%">
        <div class="empty-state__icon">🔗</div>
        <div class="empty-state__text">选择或生成一个知识图谱</div>
      </div>
      <template v-else>
        <div class="graph-toolbar">
          <span>{{ currentGraph.title }}</span>
          <span style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">{{ currentGraph.nodes.length }} 节点 · {{ currentGraph.edges.length }} 边</span>
          <el-button size="small" @click="handleExport">导出 PNG</el-button>
        </div>
        <KnowledgeGraphCanvas :nodes="currentGraph.nodes" :edges="currentGraph.edges" @node-click="handleNodeClick" />
      </template>
    </main>

    <!-- 节点详情抽屉 -->
    <el-drawer v-model="detailVisible" title="节点详情" size="400px">
      <template v-if="nodeDetail">
        <h3>{{ nodeDetail.label }}</h3>
        <p style="color:var(--color-text-secondary);margin:var(--spacing-sm) 0">{{ nodeDetail.description }}</p>
        <div v-if="nodeDetail.examples.length">
          <h4 style="margin:var(--spacing-base) 0 var(--spacing-xs)">📝 例题</h4>
          <div v-for="(ex, i) in nodeDetail.examples" :key="i" style="font-size:var(--font-size-sm);padding:var(--spacing-xs) 0;border-bottom:1px solid var(--color-border-lighter)">{{ ex }}</div>
        </div>
        <div v-if="nodeDetail.common_mistakes.length" style="margin-top:var(--spacing-base)">
          <h4 style="margin-bottom:var(--spacing-xs)">⚠️ 常见错误</h4>
          <el-tag v-for="m in nodeDetail.common_mistakes" :key="m" type="danger" size="small" style="margin:2px">{{ m }}</el-tag>
        </div>
        <div v-if="nodeDetail.related_nodes.length" style="margin-top:var(--spacing-base)">
          <h4 style="margin-bottom:var(--spacing-xs)">🔗 相关节点</h4>
          <el-tag v-for="r in nodeDetail.related_nodes" :key="r.id" size="small" style="margin:2px;cursor:pointer" @click="handleNodeClick(r.id, { id: r.id, label: r.label, type: 'knowledge', x: 0, y: 0 })">{{ r.label }}</el-tag>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-sidebar { width:260px; flex-shrink:0; background:var(--color-bg-card); border-radius:var(--radius-lg); padding:var(--spacing-base); display:flex; flex-direction:column; overflow-y:auto; }
.knowledge-main { flex:1; background:var(--color-bg-card); border-radius:var(--radius-lg); overflow:hidden; display:flex; flex-direction:column; }
.graph-toolbar { display:flex; align-items:center; gap:var(--spacing-base); padding:var(--spacing-sm) var(--spacing-base); border-bottom:1px solid var(--color-border-light); font-weight:var(--font-weight-medium); }
.history-item { display:flex; align-items:center; gap:var(--spacing-sm); padding:var(--spacing-sm) var(--spacing-xs); border-radius:var(--radius-sm); cursor:pointer; transition:background var(--transition-fast);
  &:hover { background:var(--color-bg-secondary); }
  &.active { background:var(--color-primary-lighter); }
}
</style>
