<script setup lang="ts">
// ================================================================
// AppSidebar — 智翼平台侧边导航栏
// 对应 PBI_02：首页导航 + 功能布局
// 支持折叠/展开，响应式适配
// ================================================================

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordName } from 'vue-router'

// ── 导航菜单项定义 ──
interface NavItem {
  path: string
  title: string
  icon: string
  /** PBI 编号（用于标识） */
  pbi: string
  /** 是否为 Sprint 2 功能（标注「即将上线」） */
  upcoming?: boolean
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    title: '学习仪表盘',
    icon: 'Odometer',
    pbi: 'PBI_02',
  },
  {
    path: '/agent',
    title: 'AI 助手',
    icon: 'ChatDotRound',
    pbi: 'PBI_04',
  },
  {
    path: '/summary',
    title: '课文总结',
    icon: 'Document',
    pbi: 'PBI_06',
  },
  {
    path: '/exercise',
    title: '习题练习',
    icon: 'EditPen',
    pbi: 'PBI_08/09/10',
    upcoming: true,
  },
  {
    path: '/files',
    title: '文件管理',
    icon: 'FolderOpened',
    pbi: 'PBI_05',
  },
  {
    path: '/knowledge',
    title: '知识图谱',
    icon: 'Share',
    pbi: 'PBI_11',
    upcoming: true,
  },
]

// ── Props ──
const props = defineProps<{
  collapsed: boolean
}>()

// ── Router ──
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  const matched = route.matched
  return matched.length > 0 ? matched[0].path : '/dashboard'
})

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="app-sidebar" :class="{ 'is-collapsed': collapsed }">
    <!-- ── 导航菜单 ── -->
    <nav class="sidebar-nav">
      <ul class="sidebar-nav__list">
        <li
          v-for="item in navItems"
          :key="item.path"
          class="sidebar-nav__item"
          :class="{
            'is-active': activeMenu === item.path,
            'is-upcoming': item.upcoming,
          }"
        >
          <button
            class="sidebar-nav__link"
            @click="navigate(item.path)"
            :title="collapsed ? item.title : ''"
          >
            <el-icon :size="20" class="sidebar-nav__icon">
              <component :is="item.icon" />
            </el-icon>
            <span v-show="!collapsed" class="sidebar-nav__text">{{ item.title }}</span>
            <el-badge
              v-if="item.upcoming && !collapsed"
              value="即将"
              class="sidebar-nav__badge"
            />
          </button>
        </li>
      </ul>
    </nav>

    <!-- ── 底部：Sprint 进度 ── -->
    <div v-show="!collapsed" class="sidebar-footer">
      <div class="sidebar-footer__progress">
        <div class="sidebar-footer__label">Sprint 1 进度</div>
        <el-progress :percentage="40" :stroke-width="6" :show-text="false" />
        <div class="sidebar-footer__hint">基础层 + 第一阶段开发中</div>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  z-index: var(--z-sidebar);
  width: var(--sidebar-width);
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border-light);
  transition: width var(--transition-base);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-collapsed {
    width: var(--sidebar-collapsed-width);
  }

  // ── 导航区域 ──
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm) 0;

    &__list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 var(--spacing-sm);
    }

    &__item {
      position: relative;
    }

    &__link {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md) var(--spacing-base);
      border-radius: var(--radius-md);
      cursor: pointer;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      transition: all var(--transition-fast);
      text-align: left;
      white-space: nowrap;

      &:hover {
        background: var(--color-primary-lighter);
        color: var(--color-primary);
      }
    }

    &__icon {
      flex-shrink: 0;
      transition: margin var(--transition-base);
    }

    &__text {
      flex: 1;
      text-align: left;
    }

    &__badge {
      flex-shrink: 0;
    }

    // 激活态
    &__item.is-active &__link {
      background: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }

    // 即将上线
    &__item.is-upcoming &__link {
      opacity: 0.7;
    }
  }

  // ── 底部信息 ──
  .sidebar-footer {
    padding: var(--spacing-base);
    border-top: 1px solid var(--color-border-light);

    &__progress {
      padding: var(--spacing-sm);
    }

    &__label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    &__hint {
      font-size: 11px;
      color: var(--color-text-placeholder);
      margin-top: var(--spacing-xs);
    }
  }
}

// ── 折叠态微调 ──
.is-collapsed .sidebar-nav__link {
  justify-content: center;
  padding: var(--spacing-md);
}

// ── 响应式：平板及以下隐藏侧边栏 ──
@media (max-width: 768px) {
  .app-sidebar {
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);

    &.is-collapsed {
      // 移动端 collapsed 表示显示（由 Header 按钮触发）
      // 这里保持隐藏，通过父级 class 控制
    }
  }
}
</style>
