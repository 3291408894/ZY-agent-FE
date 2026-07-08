<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { useTeachingResourceStore } from '@/stores/teachingResource'
import { useUserStore } from '@/stores/user'
import ResourceFilter from './components/ResourceFilter.vue'
import ResourceCard from './components/ResourceCard.vue'
import ResourceUploadDialog from './components/ResourceUploadDialog.vue'
import SendToClassDialog from './components/SendToClassDialog.vue'
import { downloadResource } from '@/api/modules/teachingResource'

const router = useRouter()
const store = useTeachingResourceStore()
const isTeacher = useUserStore().profile?.role === 'teacher' || useUserStore().profile?.role === 'admin'
const uploadVisible = ref(false)
const sendToClassDialog = ref<InstanceType<typeof SendToClassDialog>>()

onMounted(async () => {
  await store.fetchFilterOptions()
  await store.fetchResources(1)
})

function handleCardClick(id: string) { router.push(`/teacher/resources/${id}`) }
function handleDownload(id: string) { downloadResource(id).catch(() => {}) }
function handleSendToClass(id: string) { sendToClassDialog.value?.openForResource(id) }
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>教学资源库</h1>
        <p class="sub">上传、分享、下载优质教学资源，共建教学资源广场</p>
      </div>
      <el-button v-if="isTeacher" type="primary" @click="uploadVisible = true"><el-icon><Plus /></el-icon> 上传资源</el-button>
    </div>

    <el-tabs v-model="store.activeTab" @tab-change="(t: string) => store.switchTab(t as any)">
      <el-tab-pane label="资源广场" name="square" />
      <el-tab-pane v-if="isTeacher" label="我的资源" name="my" />
      <el-tab-pane label="我的收藏" name="favorites" />
    </el-tabs>

    <ResourceFilter v-if="store.activeTab === 'square'" />

    <div v-loading="store.loading" class="grid">
      <ResourceCard v-for="r in store.resources" :key="r.id" :resource="r" @click="handleCardClick" @download="handleDownload" @send-to-class="handleSendToClass" />
      <el-empty v-if="!store.loading && !store.resources.length" :description="store.activeTab === 'square' ? '资源广场暂无资源' : store.activeTab === 'my' ? '你还没有上传过资源' : '你还没有收藏过资源'">
        <el-button v-if="store.activeTab === 'square' && isTeacher" type="primary" @click="uploadVisible = true">上传资源</el-button>
      </el-empty>
    </div>

    <div v-if="store.total > store.pageSize" style="display:flex;justify-content:center;margin-top:24px">
      <el-pagination
        v-model:current-page="store.currentPage" :page-size="store.pageSize" :total="store.total"
        layout="total, sizes, prev, pager, next" @current-change="store.goToPage"
        @size-change="(s: number) => { store.pageSize = s; store.goToPage(1) }"
      />
    </div>

    <ResourceUploadDialog v-model:visible="uploadVisible" @uploaded="uploadVisible = false" />
    <SendToClassDialog ref="sendToClassDialog" @success="store.fetchResources(store.currentPage)" />
  </div>
</template>

<style lang="scss" scoped>
.page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; h1 { margin: 0; font-size: 24px; } .sub { margin: 4px 0 0; font-size: 13px; color: var(--el-text-color-secondary); } }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; min-height: 200px;
  @media(max-width:1200px){grid-template-columns:repeat(3,1fr)}
  @media(max-width:900px){grid-template-columns:repeat(2,1fr)}
  @media(max-width:600px){grid-template-columns:1fr}
}
</style>
