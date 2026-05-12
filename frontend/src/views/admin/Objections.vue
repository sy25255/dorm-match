<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const objections = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentItem = ref<any>(null)
const reviewForm = ref({ comment: '', status: 'RESOLVED' })

async function loadObjections() {
  loading.value = true
  try {
    const res = await adminApi.getObjections()
    objections.value = res.data.data || []
  } finally { loading.value = false }
}

function openReview(row: any) {
  currentItem.value = row
  reviewForm.value = { comment: '', status: 'RESOLVED' }
  dialogVisible.value = true
}

async function submitReview() {
  if (!currentItem.value) return
  await adminApi.reviewObjection(currentItem.value.id, reviewForm.value.comment, reviewForm.value.status)
  dialogVisible.value = false
  loadObjections()
}

const statusMap: Record<string, { label: string; type: string }> = {
  PENDING: { label: '待处理', type: 'warning' },
  REVIEWING: { label: '审核中', type: 'primary' },
  RESOLVED: { label: '已解决', type: 'success' },
  REJECTED: { label: '已驳回', type: 'danger' },
}

onMounted(loadObjections)
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>异议处理</h2></div>

    <el-table :data="objections" v-loading="loading" stripe>
      <el-table-column prop="studentName" label="申诉人" width="100" />
      <el-table-column prop="reason" label="申诉理由" min-width="250" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reviewComment" label="审核意见" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="提交时间" width="160" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button v-if="row.status !== 'RESOLVED' && row.status !== 'REJECTED'" type="primary" link size="small" @click="openReview(row)">处理</el-button>
          <span v-else style="color:#999">已完结</span>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="处理异议" width="500px">
      <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
        <el-descriptions-item label="申诉人">{{ currentItem?.studentName }}</el-descriptions-item>
        <el-descriptions-item label="理由">{{ currentItem?.reason }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="处理意见">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入处理意见" />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="reviewForm.status">
            <el-radio value="RESOLVED">通过（调整分配）</el-radio>
            <el-radio value="REJECTED">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
</style>
