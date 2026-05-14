<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

interface Objection {
  id: number
  allocationId: number
  studentId: number
  studentName: string
  reason: string
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED'
  currentHandler: number | null
  reviewComment: string
  createdAt: string
  resolvedAt?: string
}

const objections = ref<Objection[]>([])
const loading = ref(false)
const statusFilter = ref('')
const detailVisible = ref(false)
const currentItem = ref<Objection | null>(null)
const replyForm = ref({ status: 'RESOLVED' as string, comment: '' })
const submitting = ref(false)

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待处理' },
  { value: 'REVIEWING', label: '处理中' },
  { value: 'RESOLVED', label: '已解决' },
]

const filteredList = computed(() => {
  if (!statusFilter.value) return objections.value
  return objections.value.filter(o => o.status === statusFilter.value)
})

const statusMap: Record<string, { text: string; type: 'warning' | 'info' | 'success' }> = {
  PENDING: { text: '待处理', type: 'warning' },
  REVIEWING: { text: '处理中', type: 'info' },
  RESOLVED: { text: '已解决', type: 'success' },
}

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/admin/objections')
    objections.value = res.data.data || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function showDetail(item: Objection) {
  currentItem.value = item
  replyForm.value = {
    status: item.status === 'PENDING' ? 'REVIEWING' : item.status,
    comment: item.reviewComment || '',
  }
  detailVisible.value = true
}

async function submitReply() {
  if (!currentItem.value) return
  submitting.value = true
  try {
    await request.put(`/admin/objections/${currentItem.value.id}`, {
      status: replyForm.value.status,
      reviewComment: replyForm.value.comment,
    })
    currentItem.value.status = replyForm.value.status as any
    currentItem.value.reviewComment = replyForm.value.comment
    ElMessage.success('异议处理已更新')
    detailVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>异议处理</h1>
      <p>查看并处理学生对宿舍分配结果的异议申诉</p>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width:160px">
          <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-button type="primary" :icon="'RefreshRight'" @click="loadData">刷新</el-button>
      </div>

      <el-table :data="filteredList" v-loading="loading" stripe style="margin-top:12px">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="studentName" label="申诉学生" width="120" />
        <el-table-column prop="reason" label="申诉理由" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.text || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showDetail(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredList.length === 0" description="暂无异议记录" />
    </el-card>

    <el-dialog v-model="detailVisible" title="处理异议" width="550px" destroy-on-close>
      <template v-if="currentItem">
        <el-descriptions :column="1" border size="small" style="margin-bottom:20px">
          <el-descriptions-item label="申诉学生">{{ currentItem.studentName }}</el-descriptions-item>
          <el-descriptions-item label="申诉理由">{{ currentItem.reason }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentItem.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusMap[currentItem.status]?.type">
              {{ statusMap[currentItem.status]?.text }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-position="top">
          <el-form-item label="处理结果">
            <el-select v-model="replyForm.status" style="width:100%">
              <el-option label="标记为处理中" value="REVIEWING" />
              <el-option label="已解决" value="RESOLVED" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理意见">
            <el-input
              v-model="replyForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入处理意见..."
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReply">保存处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
