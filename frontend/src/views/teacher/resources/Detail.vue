<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Back, Delete } from '@element-plus/icons-vue'
import { useTeachingResourceStore } from '@/stores/teachingResource'
import { useUserStore } from '@/stores/user'
import { RESOURCE_TYPE_LABELS, FILE_TYPE_LABELS, FILE_TYPE_ICONS } from '@/types'
import { downloadResource } from '@/api/modules/teachingResource'
import SendToClassDialog from './components/SendToClassDialog.vue'

const route = useRoute(); const router = useRouter()
const store = useTeachingResourceStore(); const userStore = useUserStore()

const id = computed(() => route.params.id as string)
const isOwner = computed(() => userStore.profile?.id && store.currentDetail?.uploader?.id === userStore.profile.id)
const sendToClassDialog = ref<InstanceType<typeof SendToClassDialog>>()

onMounted(() => store.fetchDetail(id.value))

function fmtSize(b: number) { return b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB' }
function fmtDate(iso: string) { return new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function handleDownload() { if (store.currentDetail) downloadResource(store.currentDetail.id, store.currentDetail.file_name).catch(() => {}) }
function handleSendToClass() { if (store.currentDetail) sendToClassDialog.value?.openForResource(store.currentDetail.id) }

async function handleDelete() {
  try { await ElMessageBox.confirm(`确定删除「${store.currentDetail?.title}」吗？`, '删除确认', { type: 'warning' }); await store.remove(id.value); router.replace('/teacher/resources') } catch { }
}
</script>

<template>
  <div class="detail" v-loading="store.detailLoading">
    <el-button link @click="router.push('/teacher/resources')"><el-icon><Back /></el-icon> 返回资源库</el-button>

    <template v-if="store.currentDetail">
      <div class="detail-layout">
        <div class="detail-main">
          <div class="header">
            <div class="header__icon"><el-icon :size="48"><component :is="FILE_TYPE_ICONS[store.currentDetail.file_type] || 'Document'" /></el-icon></div>
            <div class="header__info">
              <h1>{{ store.currentDetail.title }}</h1>
              <div class="header__meta">
                <span>{{ store.currentDetail.file_name }}</span>
                <el-tag size="small">{{ store.currentDetail.file_ext.toUpperCase() }}</el-tag>
                <el-tag size="small" effect="plain">{{ fmtSize(store.currentDetail.file_size) }}</el-tag>
              </div>
            </div>
          </div>

          <div v-if="store.currentDetail.description" class="section">
            <h3>资源描述</h3>
            <p>{{ store.currentDetail.description }}</p>
          </div>

          <div class="section">
            <h3>资源信息</h3>
            <div class="info-grid">
              <div><span class="lbl">学科</span><el-tag>{{ store.currentDetail.subject }}</el-tag></div>
              <div><span class="lbl">年级</span><el-tag>{{ store.currentDetail.grade }}</el-tag></div>
              <div><span class="lbl">类型</span><el-tag effect="plain">{{ RESOURCE_TYPE_LABELS[store.currentDetail.resource_type] || store.currentDetail.resource_type_label }}</el-tag></div>
              <div><span class="lbl">格式</span><el-tag effect="plain">{{ FILE_TYPE_LABELS[store.currentDetail.file_type] || store.currentDetail.file_type_label }}</el-tag></div>
              <div><span class="lbl">可见性</span><el-tag :type="store.currentDetail.visibility === 'public' ? 'success' : 'info'">{{ store.currentDetail.visibility === 'public' ? '公开' : '私有' }}</el-tag></div>
              <div v-if="store.currentDetail.tags?.length"><span class="lbl">标签</span><span style="display:flex;gap:4px;flex-wrap:wrap"><el-tag v-for="t in store.currentDetail.tags" :key="t" size="small" type="warning">{{ t }}</el-tag></span></div>
            </div>
          </div>

          <div class="section">
            <h3>时间信息</h3>
            <p class="time">上传：{{ fmtDate(store.currentDetail.created_at) }} &nbsp;|&nbsp; 更新：{{ fmtDate(store.currentDetail.updated_at) }}</p>
          </div>
        </div>

        <div class="detail-side">
          <div v-if="store.currentDetail.uploader" class="side-card">
            <el-avatar :size="48" :src="store.currentDetail.uploader.avatar_url || undefined">{{ store.currentDetail.uploader.nickname.charAt(0) }}</el-avatar>
            <div style="font-weight:600;margin-top:8px">{{ store.currentDetail.uploader.nickname }}</div>
            <div style="font-size:12px;color:#999">资源提供者</div>
          </div>

          <div class="side-card stats">
            <div class="stat"><span class="n">{{ store.currentDetail.download_count }}</span><span class="l">下载</span></div>
            <div class="stat"><span class="n">{{ store.currentDetail.like_count }}</span><span class="l">收藏</span></div>
            <div class="stat"><span class="n">{{ store.currentDetail.view_count }}</span><span class="l">浏览</span></div>
          </div>

          <div class="side-card">
            <el-button type="primary" size="large" style="width:100%" @click="handleDownload"><el-icon><Download /></el-icon> 下载资源</el-button>
            <el-button v-if="userStore.isTeacher && isOwner" size="large" style="width:100%;margin-top:8px" type="success" @click="handleSendToClass">
              <el-icon><Position /></el-icon> 发送到班级
            </el-button>
            <el-button size="large" style="width:100%;margin-top:8px" :type="store.currentDetail.is_favorited ? 'warning' : 'default'" @click="store.toggleFav(store.currentDetail.id)">
              <el-icon><component :is="store.currentDetail.is_favorited ? 'StarFilled' : 'Star'" /></el-icon>
              {{ store.currentDetail.is_favorited ? '已收藏' : '收藏资源' }}
            </el-button>
            <el-button v-if="isOwner" size="large" style="width:100%;margin-top:8px" type="danger" plain @click="handleDelete"><el-icon><Delete /></el-icon> 删除资源</el-button>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-if="!store.currentDetail && !store.detailLoading" description="资源不存在或无权查看" />
    <SendToClassDialog ref="sendToClassDialog" />
  </div>
</template>

<style lang="scss" scoped>
.detail { max-width: 1200px; margin: 0 auto; }
.detail-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; @media(max-width:900px){grid-template-columns:1fr} }
.detail-main { min-width: 0; }
.detail-side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; }
.header { display: flex; gap: 20px; padding: 24px; background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 16px;
  &__icon { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: var(--el-color-primary-light-9); border-radius: 8px; color: var(--el-color-primary); flex-shrink: 0; }
  &__info { flex: 1; h1 { margin: 0 0 8px; font-size: 20px; } }
  &__meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; }
}
.section { padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; margin-bottom: 16px;
  h3 { margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; font-size: 15px; font-weight: 600; }
  p { font-size: 14px; color: #555; line-height: 1.8; margin: 0; }
  .time { font-size: 13px; color: #888; }
}
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; div { display: flex; align-items: center; gap: 8px; } .lbl { font-size: 13px; color: #999; min-width: 50px; } }
.side-card { padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; text-align: center; }
.stats { display: flex; justify-content: space-around; padding: 16px; .stat { display: flex; flex-direction: column; .n { font-size: 18px; font-weight: 700; } .l { font-size: 11px; color: #999; } } }
</style>
