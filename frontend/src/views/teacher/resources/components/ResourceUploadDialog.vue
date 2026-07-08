<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadRawFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useTeachingResourceStore } from '@/stores/teachingResource'
import { RESOURCE_TYPE_LABELS, RESOURCE_ALLOWED_EXTENSIONS, RESOURCE_MAX_SIZE } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [v: boolean]; uploaded: [] }>()
const store = useTeachingResourceStore()

const form = ref({ title: '', subject: '', grade: '', resource_type: 'other', visibility: 'public', description: '', tags: '' })
const fileList = ref<Array<{ name: string; size?: number; raw?: File }>>([])

function beforeUpload(f: UploadRawFile) {
  const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '')
  if (!RESOURCE_ALLOWED_EXTENSIONS.includes(ext)) { ElMessage.error('不支持的文件格式: ' + ext); return false }
  if (f.size > RESOURCE_MAX_SIZE) { ElMessage.error('文件大小超过限制 (最大 50MB)'); return false }
  return true
}

async function handleUpload() {
  if (!fileList.value.length || !fileList.value[0].raw) { ElMessage.warning('请选择文件'); return }
  if (!form.value.title.trim()) { ElMessage.warning('请输入资源标题'); return }
  if (!form.value.subject.trim()) { ElMessage.warning('请输入学科'); return }
  if (!form.value.grade.trim()) { ElMessage.warning('请输入适用年级'); return }

  const fd = new FormData()
  fd.append('file', fileList.value[0].raw)
  fd.append('title', form.value.title.trim())
  fd.append('subject', form.value.subject.trim())
  fd.append('grade', form.value.grade.trim())
  fd.append('resource_type', form.value.resource_type)
  fd.append('visibility', form.value.visibility)
  if (form.value.description.trim()) fd.append('description', form.value.description.trim())
  if (form.value.tags.trim()) fd.append('tags', form.value.tags.trim())

  const result = await store.upload(fd)
  if (result) { close(); emit('uploaded') }
}

function close() {
  form.value = { title: '', subject: '', grade: '', resource_type: 'other', visibility: 'public', description: '', tags: '' }
  fileList.value = []; store.uploadProgress = 0; emit('update:visible', false)
}

function fmtSize(b: number) { return b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB' }
</script>

<template>
  <el-dialog :model-value="visible" title="上传教学资源" width="600px" :close-on-click-modal="false" @update:model-value="emit('update:visible', $event)" @close="close">
    <el-form label-width="90px" label-position="left">
      <el-form-item label="选择文件" required>
        <el-upload :auto-upload="false" :limit="1" :before-upload="beforeUpload" :on-exceed="() => ElMessage.warning('最多上传 1 个文件')" drag class="upload-area" :file-list="fileList as any">
          <el-icon :size="40"><UploadFilled /></el-icon>
          <div class="upload-text"><p>将文件拖到此处，或 <em>点击选择</em></p><p class="hint">支持: PDF/Word/PPT/Excel/图片/视频/音频/压缩包，最大 50MB</p></div>
        </el-upload>
        <div v-if="fileList.length" style="margin-top:8px;font-size:13px;color:#666">{{ fileList[0].name }} &nbsp; {{ fmtSize(fileList[0].size || 0) }}</div>
      </el-form-item>
      <el-form-item v-if="store.uploading" label="上传进度">
        <el-progress :percentage="store.uploadProgress" :stroke-width="8" />
      </el-form-item>
      <el-form-item label="资源标题" required>
        <el-input v-model="form.title" placeholder="如：二次函数专题复习课件" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="学科 / 年级" required>
        <div style="display:flex;gap:12px;flex:1"><el-input v-model="form.subject" placeholder="学科" style="flex:1" /><el-input v-model="form.grade" placeholder="年级" style="flex:1" /></div>
      </el-form-item>
      <el-form-item label="类型 / 可见性">
        <div style="display:flex;gap:12px;flex:1">
          <el-select v-model="form.resource_type" style="flex:1">
            <el-option v-for="(l, v) in RESOURCE_TYPE_LABELS" :key="v" :label="l" :value="v" />
          </el-select>
          <el-select v-model="form.visibility" style="flex:1">
            <el-option label="公开" value="public" /><el-option label="私有" value="private" />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="资源描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述内容和使用场景（选填）" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="form.tags" placeholder='逗号分隔，如"二次函数,中考复习"' />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="handleUpload" :loading="store.uploading">开始上传</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-area :deep(.el-upload-dragger) { padding: 20px; }
</style>
