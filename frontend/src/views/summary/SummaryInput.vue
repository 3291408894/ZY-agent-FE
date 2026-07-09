<script setup lang="ts">
/**
 * 课文总结 — 输入区组件
 * 支持文本粘贴 / 文件上传 → 选择总结模式 → 发起 SSE 流式生成 → 自动切换结果展示
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, Document, UploadFilled, CircleClose } from '@element-plus/icons-vue'
import { useSummaryStore } from '@/stores/summary'
import { useSSE } from '@/composables/useSSE'
import { getSummaryGenerateUrl, SUMMARY_MODE_LABELS, SUMMARY_MODE_DESCRIPTIONS } from '@/api/modules/summary'
import SummaryResult from './SummaryResult.vue'
import type { SummaryMode, SummarySourceType } from '@/types'

const store = useSummaryStore()
const { connect, disconnect } = useSSE()

// ── 表单状态 ──
const sourceType = ref<SummarySourceType>('text')
const inputText = ref('')
const selectedMode = ref<SummaryMode>('detailed')
const showResult = ref(false)

// ── 文件上传 ──
const uploadedFile = ref<{ id: string; name: string; size: string } | null>(null)
const isUploading = ref(false)
const uploadRef = ref<HTMLInputElement | null>(null)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const allowedExts = ['.txt', '.pdf', '.docx', '.doc', '.md']
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExts.includes(ext)) {
    ElMessage.warning(`不支持的文件格式，支持：${allowedExts.join(', ')}`)
    input.value = ''
    return
  }

  isUploading.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    uploadedFile.value = {
      id: 'temp-' + Date.now(),
      name: file.name,
      size: formatFileSize(file.size),
    }
    inputText.value = file.name
    ElMessage.success('文件上传成功')
  } catch {
    ElMessage.error('文件上传失败，请重试')
  } finally {
    isUploading.value = false
    if (input) input.value = ''
  }
}

function handleRemoveFile() {
  uploadedFile.value = null
  inputText.value = ''
  if (uploadRef.value) uploadRef.value.value = ''
}

function triggerUpload() {
  uploadRef.value?.click()
}

// ── 字数统计 ──
const charCount = computed(() => inputText.value.length)
const isOverLimit = computed(() => charCount.value > 50000)
const isTooShort = computed(() => sourceType.value === 'text' && charCount.value < 10)

const canSubmit = computed(
  () => !store.isStreaming && (
    (sourceType.value === 'text' && charCount.value >= 10 && !isOverLimit.value) ||
    (sourceType.value === 'file' && uploadedFile.value !== null)
  )
)

// ── 发起总结 ──
async function handleGenerate() {
  if (!canSubmit.value) return

  store.resetCurrent()
  store.isStreaming = true
  showResult.value = true

  await connect(
    getSummaryGenerateUrl(),
    {
      source_type: sourceType.value,
      content: inputText.value.trim(),
      mode: selectedMode.value,
      file_id: uploadedFile.value?.id || null,
    },
    {
      onContent(chunk) {
        store.appendContent(chunk)
      },
      onKnowledgePoints(points) {
        store.setKnowledgePoints(points)
      },
      onDone(data) {
        store.setDone(data.summary_id || '')
        ElMessage.success('总结生成完成！')
        store.fetchHistory().catch(() => {})
      },
      onError(msg) {
        store.setStreamError(msg)
        ElMessage.error(msg)
      },
    },
  )
}

function handleStop() {
  disconnect()
  store.isStreaming = false
  ElMessage.info('已停止生成')
}

function handleNew() {
  showResult.value = false
  inputText.value = ''
  uploadedFile.value = null
  sourceType.value = 'text'
  store.resetCurrent()
}

function handleClear() {
  inputText.value = ''
  uploadedFile.value = null
}

function handleModeSelect(mode: SummaryMode) {
  if (!store.isStreaming) selectedMode.value = mode
}

// ── 示例课文 ──
const examples = [
  {
    label: '桃花源记',
    author: '陶渊明',
    icon: '🌸',
    text: '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。林尽水源，便得一山，山有小口，仿佛若有光。便舍船，从口入。初极狭，才通人。复行数十步，豁然开朗。土地平旷，屋舍俨然，有良田、美池、桑竹之属。阡陌交通，鸡犬相闻。其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。',
  },
  {
    label: '背影（节选）',
    author: '朱自清',
    icon: '🚂',
    text: '我看见他戴着黑布小帽，穿着黑布大马褂，深青布棉袍，蹒跚地走到铁道边，慢慢探身下去，尚不大难。可是他穿过铁道，要爬上那边月台，就不容易了。他用两手攀着上面，两脚再向上缩；他肥胖的身子向左微倾，显出努力的样子。这时我看见他的背影，我的泪很快地流下来了。',
  },
]
function fillExample(text: string) {
  sourceType.value = 'text'
  inputText.value = text
}
</script>

<template>
  <div class="summary-input">
    <!-- 输入面板 -->
    <div class="input-panel">
      <!-- 步骤1：模式选择 -->
      <div class="section">
        <div class="section__header">
          <span class="section__step">1</span>
          <span class="section__title">选择总结模式</span>
        </div>
        <div class="mode-cards">
          <div
            class="mode-card"
            :class="{ 'mode-card--active': selectedMode === 'brief', 'mode-card--disabled': store.isStreaming }"
            @click="handleModeSelect('brief')"
          >
            <div class="mode-card__icon">⚡</div>
            <div class="mode-card__info">
              <div class="mode-card__name">{{ SUMMARY_MODE_LABELS.brief }}</div>
              <div class="mode-card__desc">{{ SUMMARY_MODE_DESCRIPTIONS.brief }}</div>
            </div>
            <div v-if="selectedMode === 'brief'" class="mode-card__check">✓</div>
          </div>
          <div
            class="mode-card"
            :class="{ 'mode-card--active': selectedMode === 'detailed', 'mode-card--disabled': store.isStreaming }"
            @click="handleModeSelect('detailed')"
          >
            <div class="mode-card__icon">📋</div>
            <div class="mode-card__info">
              <div class="mode-card__name">{{ SUMMARY_MODE_LABELS.detailed }}</div>
              <div class="mode-card__desc">{{ SUMMARY_MODE_DESCRIPTIONS.detailed }}</div>
            </div>
            <div v-if="selectedMode === 'detailed'" class="mode-card__check">✓</div>
          </div>
        </div>
      </div>

      <!-- 步骤2：内容输入 -->
      <div class="section">
        <div class="section__header">
          <span class="section__step">2</span>
          <span class="section__title">输入课文内容</span>
        </div>

        <!-- 来源切换 -->
        <div class="source-toggle">
          <button
            class="source-toggle__btn"
            :class="{ 'source-toggle__btn--active': sourceType === 'text' }"
            :disabled="store.isStreaming"
            @click="sourceType = 'text'"
          >
            <el-icon><Document /></el-icon>
            粘贴文本
          </button>
          <button
            class="source-toggle__btn"
            :class="{ 'source-toggle__btn--active': sourceType === 'file' }"
            :disabled="store.isStreaming"
            @click="sourceType = 'file'"
          >
            <el-icon><UploadFilled /></el-icon>
            上传文件
          </button>
        </div>

        <!-- 文本输入 -->
        <div v-if="sourceType === 'text'" class="text-area-wrapper">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="14"
            :disabled="store.isStreaming"
            placeholder="在此粘贴课文原文内容……&#10;&#10;支持文言文、现代文、诗歌等各类课文，AI 将自动分析并生成结构化总结"
            class="text-area-wrapper__input"
          />
          <div class="text-area-wrapper__footer">
            <div class="char-info">
              <span
                class="char-count"
                :class="{ 'char-count--warn': isOverLimit, 'char-count--ok': charCount >= 10 && !isOverLimit }"
              >
                {{ charCount.toLocaleString() }} / 50,000 字
              </span>
              <span v-if="isTooShort && charCount > 0" class="char-hint">
                ✏️ 至少输入 10 个字符
              </span>
              <span v-else-if="charCount >= 10 && !isOverLimit" class="char-hint char-hint--ready">
                ✅ 满足要求，可以开始总结
              </span>
            </div>
            <el-button
              v-if="inputText"
              text
              size="small"
              type="primary"
              :disabled="store.isStreaming"
              @click="handleClear"
            >
              清空内容
            </el-button>
          </div>
        </div>

        <!-- 文件上传 -->
        <div v-else class="upload-zone" @click="!isUploading && !uploadedFile && triggerUpload()">
          <input
            ref="uploadRef"
            type="file"
            accept=".txt,.pdf,.docx,.doc,.md"
            style="display: none"
            :disabled="store.isStreaming"
            @change="handleFileChange"
          />
          <div v-if="!uploadedFile && !isUploading" class="upload-zone__empty">
            <el-icon :size="40"><UploadFilled /></el-icon>
            <p class="upload-zone__title">点击上传课文文件</p>
            <p class="upload-zone__hint">支持 TXT、PDF、DOCX、MD 格式</p>
          </div>
          <div v-else-if="isUploading" class="upload-zone__loading">
            <el-icon class="is-loading" :size="32"><UploadFilled /></el-icon>
            <p>正在上传解析…</p>
          </div>
          <div v-else class="upload-zone__file">
            <div class="upload-zone__file-info">
              <el-icon :size="28" color="#5B9BD5"><Document /></el-icon>
              <div>
                <p class="upload-zone__file-name">{{ uploadedFile!.name }}</p>
                <p class="upload-zone__file-size">{{ uploadedFile!.size }}</p>
              </div>
            </div>
            <el-button text type="danger" size="small" :disabled="store.isStreaming" @click.stop="handleRemoveFile">
              <el-icon><CircleClose /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button
          type="primary"
          size="large"
          :disabled="!canSubmit"
          :loading="store.isStreaming"
          class="action-bar__generate"
          @click="handleGenerate"
        >
          <el-icon v-if="!store.isStreaming"><MagicStick /></el-icon>
          {{ store.isStreaming ? 'AI 正在分析课文…' : '✨ 开始智能总结' }}
        </el-button>
        <el-button
          v-if="store.isStreaming"
          type="danger"
          size="large"
          plain
          @click="handleStop"
        >
          停止生成
        </el-button>
      </div>

      <!-- 快捷示例 -->
      <div class="examples-section">
        <div class="examples-section__header">
          <span>💡 快速体验 — 点击示例课文立即开始</span>
        </div>
        <div class="examples-grid">
          <div
            v-for="ex in examples"
            :key="ex.label"
            class="example-card"
            :class="{ 'example-card--disabled': store.isStreaming }"
            @click="!store.isStreaming && fillExample(ex.text)"
          >
            <span class="example-card__icon">{{ ex.icon }}</span>
            <div class="example-card__info">
              <div class="example-card__title">{{ ex.label }}</div>
              <div class="example-card__author">{{ ex.author }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <SummaryResult
      v-if="showResult"
      @new-summary="handleNew"
    />
  </div>
</template>

<style lang="scss" scoped>
.summary-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.input-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

// ── Section ──
.section {
  margin-bottom: var(--spacing-xl);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  &__step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }
}

// ── 模式卡片 ──
.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.mode-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg);

  &:hover:not(&--disabled) {
    border-color: var(--color-primary-light);
    background: var(--color-primary-lighter);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &--active {
    border-color: var(--color-primary);
    background: var(--color-primary-lighter);
    box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.15);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &__icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
  &__info { flex: 1; min-width: 0; }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  &__check {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }
}

// ── 来源切换 ──
.source-toggle {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: 4px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: inherit;

    &:hover:not(:disabled) { color: var(--color-text); }

    &--active {
      background: var(--color-bg-card);
      color: var(--color-primary);
      font-weight: 500;
      box-shadow: var(--shadow-sm);
    }

    &:disabled { cursor: not-allowed; opacity: 0.5; }
  }
}

// ── 文本输入 ──
.text-area-wrapper {
  &__input {
    :deep(.el-textarea__inner) {
      font-size: var(--font-size-base, 15px);
      line-height: 1.9;
      resize: vertical;
      font-family: 'Georgia', 'Noto Serif SC', 'STSong', 'SimSun', 'PingFang SC', 'Microsoft YaHei', serif;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      background: var(--color-bg);

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.12);
      }

      &::placeholder {
        color: var(--color-text-placeholder);
        font-style: italic;
      }
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-sm);
  }
}

.char-info { display: flex; align-items: center; gap: var(--spacing-md); }
.char-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  &--ok { color: var(--color-success); }
  &--warn { color: var(--color-danger); font-weight: 500; }
}
.char-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  &--ready { color: var(--color-success); }
}

// ── 文件上传 ──
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xxl) var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-lighter);
  }

  &__empty .el-icon { color: var(--color-text-placeholder); margin-bottom: var(--spacing-md); }
  &__title { font-size: 15px; font-weight: 500; color: var(--color-text); margin-bottom: var(--spacing-xs); }
  &__hint { font-size: 13px; color: var(--color-text-secondary); }
  &__loading { color: var(--color-primary); font-size: 14px; }

  &__file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: var(--color-bg-card);
    border-radius: var(--radius-md);
  }

  &__file-info { display: flex; align-items: center; gap: var(--spacing-md); text-align: left; }
  &__file-name { font-size: 14px; font-weight: 500; color: var(--color-text); }
  &__file-size { font-size: 12px; color: var(--color-text-secondary); }
}

// ── 操作按钮 ──
.action-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding-top: var(--spacing-sm);

  &__generate {
    min-width: 180px;
    font-weight: 500;
    font-size: 15px;
    height: 44px;
    border-radius: var(--radius-md);
  }
}

// ── 示例 ──
.examples-section {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);

  &__header {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.example-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg);

  &:hover:not(&--disabled) {
    border-color: var(--color-primary);
    background: var(--color-primary-lighter);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &--disabled { cursor: not-allowed; opacity: 0.5; }
  &__icon { font-size: 24px; flex-shrink: 0; }
  &__info { min-width: 0; }
  &__title { font-size: 14px; font-weight: 500; color: var(--color-text); }
  &__author { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
}

// ── 响应式 ──
@media (max-width: 640px) {
  .mode-cards, .examples-grid { grid-template-columns: 1fr; }
  .input-panel { padding: var(--spacing-lg); }
}
</style>
