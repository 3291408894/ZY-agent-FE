<script setup lang="ts">
// ================================================================
// AppHeader — 智翼平台顶部导航栏
// 包含：Logo、导航菜单、字体调节、主题切换、用户菜单
// ================================================================

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useTheme } from '@/composables/useTheme'
import { useFontSize, FONT_PRESETS } from '@/composables/useFontSize'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { isDark, toggleMode, modeLabel } = useTheme()
const { currentPx, currentPercent, sizeLabel, canDecrease, canIncrease, isDefault, presets, setFontSize, increase, decrease, reset } = useFontSize()

// ── 字体弹窗 ──
const fontSizePopoverVisible = ref(false)
const fontSizeSliderValue = ref(currentPx.value)

function onSliderInput(val: number) {
  fontSizeSliderValue.value = val
  setFontSize(val)
}

function onPopoverShow() {
  fontSizeSliderValue.value = currentPx.value
}

// ── 用户下拉菜单 ──
const userMenuVisible = ref(false)

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/profile')
      break
    case 'logout':
      userStore.clearAuth()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

// ── 移动端侧边栏切换 ──
const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

defineProps<{
  isSidebarCollapsed: boolean
}>()
</script>

<template>
  <header class="app-header">
    <!-- ── 左侧：Logo + 折叠按钮 ── -->
    <div class="app-header__left">
      <button class="app-header__collapse-btn" @click="emit('toggle-sidebar')" title="折叠侧边栏">
        <el-icon :size="20">
          <component :is="isSidebarCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>

      <router-link to="/dashboard" class="app-header__logo">
        <div class="app-header__logo-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="var(--color-primary)" />
            <path
              d="M20 8C16.5 14 12 18 10 22C8 26 10 32 20 32C30 32 32 26 30 22C28 18 23.5 14 20 8Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="16" cy="21" r="2" fill="var(--color-primary-darkest)" />
            <circle cx="24" cy="21" r="2" fill="var(--color-primary-darkest)" />
          </svg>
        </div>
        <span class="app-header__logo-text">智翼</span>
        <span class="app-header__logo-sub">ZhiYi AI</span>
      </router-link>
    </div>

    <!-- ── 右侧：工具栏 ── -->
    <div class="app-header__right">
      <!-- 字体调节 — 滑条无级缩放 -->
      <el-popover
        v-model:visible="fontSizePopoverVisible"
        trigger="click"
        placement="bottom"
        :width="280"
        @show="onPopoverShow"
      >
        <template #reference>
          <el-tooltip :content="`字体大小：${sizeLabel}（点击调节）`" placement="bottom">
            <button class="toolbar-btn toolbar-btn--font" aria-label="字体大小调节">
              <el-icon :size="16"><ZoomIn /></el-icon>
              <span class="font-size-badge">{{ currentPercent }}%</span>
            </button>
          </el-tooltip>
        </template>

        <!-- 弹出内容 -->
        <div class="font-size-popover">
          <div class="font-size-popover__header">
            <span>字体大小</span>
            <span class="font-size-popover__value">{{ sizeLabel }}</span>
          </div>

          <!-- 滑条 -->
          <div class="font-size-popover__slider">
            <span class="font-size-popover__label">A</span>
            <el-slider
              v-model="fontSizeSliderValue"
              :min="12"
              :max="20"
              :step="1"
              :show-tooltip="true"
              :marks="{ 12: '12', 15: '15', 18: '18', 20: '20' }"
              @input="onSliderInput"
            />
            <span class="font-size-popover__label font-size-popover__label--large">A</span>
          </div>

          <!-- 预设 -->
          <div class="font-size-popover__presets">
            <el-button
              v-for="p in presets"
              :key="p.value"
              :type="currentPx === p.value ? 'primary' : 'default'"
              size="small"
              @click="setFontSize(p.value)"
            >
              {{ p.label }} ({{ p.value }}px)
            </el-button>
          </div>

          <!-- 操作行 -->
          <div class="font-size-popover__actions">
            <el-button :disabled="!canDecrease" size="small" @click="decrease">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button :disabled="!canIncrease" size="small" @click="increase">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button :disabled="isDefault" size="small" @click="reset">
              恢复默认
            </el-button>
          </div>

          <div class="font-size-popover__hint">
            提示：<kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> / <kbd>0</kbd> 快捷调节
          </div>
        </div>
      </el-popover>

      <el-divider direction="vertical" />

      <!-- 配色方案切换 (护眼/经典) -->
      <el-tooltip :content="themeStore.colorScheme === 'eye-care' ? '当前：护眼配色' : '当前：经典配色'" placement="bottom">
        <button class="toolbar-btn" @click="themeStore.setColorScheme(themeStore.colorScheme === 'eye-care' ? 'classic' : 'eye-care')">
          <el-icon :size="18" :color="themeStore.colorScheme === 'eye-care' ? '#5B9BD5' : '#409EFF'">
            <View />
          </el-icon>
        </button>
      </el-tooltip>

      <!-- 亮色/暗色切换 -->
      <el-tooltip :content="modeLabel" placement="bottom">
        <button class="toolbar-btn" @click="toggleMode">
          <el-icon :size="18">
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </button>
      </el-tooltip>

      <!-- 阅读模式 -->
      <el-tooltip :content="themeStore.readingMode ? '退出阅读模式' : '阅读模式'" placement="bottom">
        <button
          class="toolbar-btn"
          :class="{ 'toolbar-btn--active': themeStore.readingMode }"
          @click="themeStore.toggleReadingMode()"
        >
          <el-icon :size="18">
            <Reading />
          </el-icon>
        </button>
      </el-tooltip>

      <el-divider direction="vertical" />

      <!-- 用户头像 & 下拉菜单 -->
      <el-dropdown trigger="click" @command="handleCommand" v-if="userStore.isLoggedIn">
        <div class="app-header__user">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="app-header__user-name">
            {{ userStore.profile?.nickname || userStore.profile?.email || '同学' }}
          </span>
          <el-icon :size="12"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              账号设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 未登录时显示登录按钮 -->
      <el-button v-else type="primary" size="small" @click="router.push('/login')">
        登录
      </el-button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-header);
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    text-decoration: none;
    color: var(--color-text-primary);
    margin-left: var(--spacing-xs);
  }

  &__logo-icon {
    width: 34px;
    height: 34px;
    flex-shrink: 0;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__logo-text {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__logo-sub {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    display: none;

    @media (min-width: 768px) {
      display: inline;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-base);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-bg-secondary);
    }

    &-name {
      font-size: var(--font-size-sm);
      color: var(--color-text);
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      @media (max-width: 768px) {
        display: none;
      }
    }
  }
}

// ── 工具栏按钮 ──
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--spacing-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--text {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    min-width: 24px;
  }

  &--active {
    color: var(--color-primary);
    background: var(--color-primary-lighter);
  }

  &--font {
    gap: 4px;
    min-width: auto;
    padding: 0 6px;

    .font-size-badge {
      font-size: 10px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary);
      background: var(--color-primary-lighter);
      border-radius: 8px;
      padding: 0 5px;
      line-height: 16px;
      min-width: 30px;
      text-align: center;
    }
  }
}

// ── 字体调节弹窗 ──
.font-size-popover {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
  }

  &__slider {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    padding: 0 4px;
  }

  &__label {
    font-size: 13px;
    color: var(--color-text-placeholder);
    flex-shrink: 0;

    &--large {
      font-size: 18px;
    }
  }

  &__presets {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  &__actions {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  &__hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-placeholder);
    border-top: 1px solid var(--color-border-lighter);
    padding-top: var(--spacing-sm);

    kbd {
      font-family: var(--font-family-code);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border-light);
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 11px;
    }
  }
}

// ── 分隔线 ──
.app-header .el-divider--vertical {
  height: 20px;
}

// ── 移动端适配 ──
@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--spacing-base);

    &__toolbar {
      display: none; // 移动端隐藏字体调节
    }
  }
}
</style>
