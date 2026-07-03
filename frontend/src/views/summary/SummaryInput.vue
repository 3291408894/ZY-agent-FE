<script setup lang="ts">
/**
 * 课文总结 — 输入区组件
 * 支持文本粘贴 → 选择总结模式 → 发起 SSE 流式生成 → 自动切换结果展示
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSummaryStore } from '@/stores/summary'
import { useSSE } from '@/composables/useSSE'
import { getSummaryGenerateUrl, SUMMARY_MODE_LABELS, SUMMARY_MODE_DESCRIPTIONS } from '@/api/modules/summary'
import SummaryResult from './SummaryResult.vue'
import type { SummaryMode } from '@/types'

const store = useSummaryStore()
const { isStreaming, connect, disconnect } = useSSE()

// ── 表单状态 ──
const inputText = ref('')
const selectedMode = ref<SummaryMode>('detailed')
const showResult = ref(false)

// ── 字数统计 ──
const charCount = computed(() => inputText.value.length)
const isOverLimit = computed(() => charCount.value > 50000)
const isTooShort = computed(() => charCount.value < 10)

const canSubmit = computed(
  () => !isStreaming.value && charCount.value >= 10 && !isOverLimit.value
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
      source_type: 'text',
      content: inputText.value.trim(),
      mode: selectedMode.value,
      file_id: null,
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
      },
      onError(msg) {
        store.setStreamError(msg)
        ElMessage.error(msg)
      },
    },
  )
}

/** 停止生成 */
function handleStop() {
  disconnect()
  store.isStreaming = false
  ElMessage.info('已停止生成')
}

/** 新建总结（清除当前结果） */
function handleNew() {
  showResult.value = false
  inputText.value = ''
  store.resetCurrent()
}

/** 清空输入 */
function handleClear() {
  inputText.value = ''
}

/** 选择模式 */
function handleModeSelect(mode: SummaryMode) {
  selectedMode.value = mode
}

// ── 快捷填充（示例课文） ──
const examples = [
  {
    label: '桃花源记',
    text: '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。林尽水源，便得一山，山有小口，仿佛若有光。便舍船，从口入。初极狭，才通人。复行数十步，豁然开朗。土地平旷，屋舍俨然，有良田、美池、桑竹之属。阡陌交通，鸡犬相闻。其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。',
  },
  {
    label: '背影（节选）',
    text: '我看见他戴着黑布小帽，穿着黑布大马褂，深青布棉袍，蹒跚地走到铁道边，慢慢探身下去，尚不大难。可是他穿过铁道，要爬上那边月台，就不容易了。他用两手攀着上面，两脚再向上缩；他肥胖的身子向左微倾，显出努力的样子。这时我看见他的背影，我的泪很快地流下来了。',
  },
]
function fillExample(text: string) {
  inputText.value = text
}
</script>

<template>
  <div class="summary-input">
    <!-- ── 输入区 ── -->
    <div class="summary-input__panel">
      <!-- 模式选择 -->
      <div class="mode-selector">
        <span class="mode-selector__label">总结模式：</span>
        <el-radio-group
          v-model="selectedMode"
          :disabled="isStreaming"
          @change="handleModeSelect"
        >
          <el-radio-button value="brief">
            <span class="mode-option">
              <strong>{{ SUMMARY_MODE_LABELS.brief }}</strong>
              <span class="mode-option__desc">{{ SUMMARY_MODE_DESCRIPTIONS.brief }}</span>
            </span>
          </el-radio-button>
          <el-radio-button value="detailed">
            <span class="mode-option">
              <strong>{{ SUMMARY_MODE_LABELS.detailed }}</strong>
              <span class="mode-option__desc">{{ SUMMARY_MODE_DESCRIPTIONS.detailed }}</span>
            </span>
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文本输入 -->
      <div class="text-input">
        <div class="text-input__header">
          <label class="text-input__label">课文原文</label>
          <div class="text-input__actions">
            <el-button
              text
              size="small"
              type="primary"
              :disabled="isStreaming"
              @click="handleClear"
            >
              清空
            </el-button>
          </div>
        </div>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="12"
          :disabled="isStreaming"
          placeholder="请粘贴课文原文内容（最少 10 字）&#10;&#10;例如：晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近……"
          class="text-input__textarea"
        />
        <div class="text-input__footer">
          <span
            class="char-count"
            :class="{ 'char-count--warn': isOverLimit }"
          >
            {{ charCount }} / 50000 字
          </span>
          <span v-if="isTooShort && charCount > 0" class="char-hint">
            至少输入 10 个字符
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button
          type="primary"
          size="large"
          :disabled="!canSubmit"
          :loading="isStreaming"
          @click="handleGenerate"
        >
          <el-icon v-if="!isStreaming"><MagicStick /></el-icon>
          {{ isStreaming ? '正在生成总结…' : '开始总结' }}
        </el-button>
        <el-button
          v-if="isStreaming"
          type="danger"
          size="large"
          plain
          @click="handleStop"
        >
          停止生成
        </el-button>
      </div>

      <!-- 快捷示例 -->
      <div class="examples">
        <span class="examples__label">快速体验：</span>
        <el-tag
          v-for="ex in examples"
          :key="ex.label"
          class="examples__tag"
          :class="{ 'examples__tag--disabled': isStreaming }"
          :disable-transitions="false"
          @click="!isStreaming && fillExample(ex.text)"
        >
          {{ ex.label }}
        </el-tag>
      </div>
    </div>

    <!-- ── 结果展示（总结完成后出现） ── -->
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

.summary-input__panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

// ── 模式选择 ──
.mode-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;

  &__label {
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
  }

  :deep(.el-radio-button__inner) {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: left;
  }
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: var(--font-size-base, 15px);
  }

  &__desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: normal;
  }
}

// ── 文本输入 ──
.text-input {
  margin-bottom: var(--spacing-lg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }

  &__label {
    font-weight: 500;
    color: var(--color-text);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  &__textarea {
    :deep(.el-textarea__inner) {
      font-size: var(--font-size-base, 15px);
      line-height: 1.8;
      resize: vertical;
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-sm);
  }
}

.char-count {
  font-size: 13px;
  color: var(--color-text-secondary);

  &--warn {
    color: var(--color-danger);
    font-weight: 500;
  }
}

.char-hint {
  font-size: 12px;
  color: var(--color-warning);
}

// ── 操作按钮 ──
.action-bar {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

// ── 快捷示例 ──
.examples {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;

  &__label {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  &__tag {
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover:not(&--disabled) {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }

    &--disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
