<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { useTeachingResourceStore } from '@/stores/teachingResource'

const store = useTeachingResourceStore()

function onSearch() { store.setFilter('keyword', store.filters.keyword) }
</script>

<template>
  <div class="filter-bar">
    <el-input v-model="store.filters.keyword" placeholder="搜索资源标题、描述..." :prefix-icon="Search" clearable size="default" style="max-width:420px" @keyup.enter="onSearch" @clear="store.setFilter('keyword', undefined)">
      <template #append><el-button @click="onSearch">搜索</el-button></template>
    </el-input>
    <el-select v-model="store.filters.subject" placeholder="全部学科" clearable size="default" style="width:120px" @change="store.setFilter('subject', $event)">
      <el-option v-for="s in store.filterOptions.subjects" :key="s" :label="s" :value="s" />
    </el-select>
    <el-select v-model="store.filters.grade" placeholder="全部年级" clearable size="default" style="width:120px" @change="store.setFilter('grade', $event)">
      <el-option v-for="g in store.filterOptions.grades" :key="g" :label="g" :value="g" />
    </el-select>
    <el-select v-model="store.filters.resource_type" placeholder="全部类型" clearable size="default" style="width:120px" @change="store.setFilter('resource_type', $event)">
      <el-option v-for="rt in store.filterOptions.resource_types" :key="rt.value" :label="rt.label" :value="rt.value" />
    </el-select>
    <el-select v-model="store.filters.file_type" placeholder="全部格式" clearable size="default" style="width:120px" @change="store.setFilter('file_type', $event)">
      <el-option v-for="ft in store.filterOptions.file_types" :key="ft.value" :label="ft.label" :value="ft.value" />
    </el-select>
    <el-select :model-value="store.filters.sort_by" size="default" style="width:130px" @change="store.setFilter('sort_by', $event)">
      <el-option label="最新上传" value="created_at" />
      <el-option label="最多下载" value="download_count" />
      <el-option label="最多收藏" value="like_count" />
    </el-select>
    <el-button v-if="store.filters.subject || store.filters.grade || store.filters.resource_type || store.filters.file_type" size="default" @click="store.clearFilters()">清除筛选</el-button>
  </div>
</template>

<style lang="scss" scoped>
.filter-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 16px; background: var(--el-bg-color, #fff); border-radius: 12px;
  border: 1px solid var(--el-border-color-light, #e8e8e8); margin-bottom: 16px;
}
</style>
