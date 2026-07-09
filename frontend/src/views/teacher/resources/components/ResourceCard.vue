<script setup lang="ts">
import type { ITeachingResource } from '@/types'
import { FILE_TYPE_ICONS, RESOURCE_TYPE_LABELS } from '@/types'
import { useTeachingResourceStore } from '@/stores/teachingResource'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ resource: ITeachingResource }>()
const emit = defineEmits<{ click: [id: string]; download: [id: string]; sendToClass: [id: string] }>()
const store = useTeachingResourceStore()
const userStore = useUserStore()

function fmtSize(b: number): string {
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtDate(iso: string): string {
  const d = new Date(iso), now = Date.now(), diff = now - d.getTime()
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="card" @click="emit('click', resource.id)">
    <div class="card__icon-area">
      <el-icon :size="40"><component :is="FILE_TYPE_ICONS[resource.file_type] || 'Document'" /></el-icon>
      <span class="card__icon-label">{{ resource.file_type_label }}</span>
    </div>

    <div class="card__body">
      <h3 class="card__title" :title="resource.title">{{ resource.title }}</h3>
      <p v-if="resource.description" class="card__desc">{{ resource.description }}</p>
      <div class="card__tags">
        <el-tag size="small" type="info">{{ resource.subject }}</el-tag>
        <el-tag size="small" type="info">{{ resource.grade }}</el-tag>
        <el-tag size="small" effect="plain">{{ RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type_label }}</el-tag>
        <el-tag v-for="t in (resource.tags || []).slice(0, 3)" :key="t" size="small" effect="plain" type="warning">{{ t }}</el-tag>
      </div>
    </div>

    <div class="card__footer">
      <div class="card__stats">
        <span class="card__stat"><el-icon :size="14"><Download /></el-icon> {{ resource.download_count }}</span>
        <span class="card__stat"><el-icon :size="14"><Star /></el-icon> {{ resource.like_count }}</span>
        <span class="card__uploader" v-if="resource.uploader">{{ resource.uploader.nickname }}</span>
      </div>
      <div class="card__actions" @click.stop>
        <el-button link size="small" :type="resource.is_favorited ? 'warning' : 'default'" @click="store.toggleFav(resource.id)">
          <el-icon :size="16"><component :is="resource.is_favorited ? 'StarFilled' : 'Star'" /></el-icon>
        </el-button>
        <el-button link size="small" type="primary" @click="emit('download', resource.id)">
          <el-icon :size="16"><Download /></el-icon>
        </el-button>
        <el-button
          v-if="userStore.isTeacher"
          link
          size="small"
          type="success"
          @click="emit('sendToClass', resource.id)"
        >
          <el-icon :size="16"><Position /></el-icon>
        </el-button>
      </div>
    </div>
    <span class="card__time">{{ fmtDate(resource.created_at) }}</span>
  </div>
</template>

<style lang="scss" scoped>
.card {
  position: relative; display: flex; flex-direction: column; gap: 8px;
  background: var(--el-bg-color, #fff); border-radius: 12px; border: 1px solid var(--el-border-color-light, #e8e8e8);
  padding: 20px; cursor: pointer; transition: all .2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); transform: translateY(-2px); border-color: var(--el-color-primary-light-5); }
  &__icon-area { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 0; background: var(--el-color-primary-light-9); border-radius: 8px; margin-bottom: 4px; color: var(--el-color-primary); }
  &__icon-label { font-size: 12px; color: var(--el-text-color-secondary); }
  &__body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  &__title { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; }
  &__desc { font-size: 12px; color: var(--el-text-color-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; line-height: 1.5; }
  &__tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; }
  &__footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter); }
  &__stats { display: flex; align-items: center; gap: 12px; }
  &__stat { display: flex; align-items: center; gap: 2px; font-size: 12px; color: #999; }
  &__uploader { font-size: 12px; color: #999; }
  &__actions { display: flex; gap: 2px; }
  &__time { position: absolute; top: 8px; right: 8px; font-size: 11px; color: #bbb; }
}
</style>
