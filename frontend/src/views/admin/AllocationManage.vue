<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const allocations = ref<any[]>([])
const loading = ref(false)
const batchCode = ref('BATCH-2024-001')
const currentStep = ref(0)

const steps = ['执行分配', '查看结果', '发布公示', '正式确认']

async function loadResults() {
  if (!batchCode.value) return
  loading.value = true
  try {
    const res = await adminApi.getAllocationResults(batchCode.value)
    allocations.value = res.data.data || []
  } finally { loading.value = false }
}

async function executeAlloc() {
  try {
    await ElMessageBox.confirm('确认执行批量分配？系统将根据配对和算法自动分配宿舍', '确认操作', { type: 'warning' })
    await adminApi.executeAllocation(batchCode.value)
    currentStep.value = 1
    loadResults()
  } catch {}
}

async function publishResults() {
  try {
    await ElMessageBox.confirm('确认发布预分配结果？学生将看到自己的分配信息', '确认操作', { type: 'warning' })
    await adminApi.publishResults(batchCode.value)
    currentStep.value = 2
    ElMessage.success('预分配结果已发布，学生可查看并确认/申诉')
  } catch {}
}

async function finalizeResults() {
  try {
    await ElMessageBox.confirm('确认正式分配结果？此操作不可撤销', '最终确认', { type: 'warning' })
    await adminApi.finalizeResults(batchCode.value)
    currentStep.value = 3
    ElMessage.success('正式分配结果已确认')
  } catch {}
}

const typeMap: Record<string, { label: string; type: string }> = {
  SELF_SELECT: { label: '自主选择', type: 'success' },
  ALGORITHM: { label: '算法推荐', type: 'primary' },
  RANDOM: { label: '随机分配', type: 'info' },
  MANUAL: { label: '手动调整', type: 'warning' },
}
const statusMap: Record<string, string> = { PENDING: '待确认', CONFIRMED: '已确认', OBJECTION: '异议中', RESOLVED: '已解决' }

onMounted(loadResults)
</script>

<template>
  <div>
    <div class="page-toolbar"><h2>宿舍分配管理</h2></div>

    <el-steps :active="currentStep" finish-status="success" style="margin-bottom:24px">
      <el-step :title="s" v-for="s in steps" :key="s" />
    </el-steps>

    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <el-input v-model="batchCode" placeholder="批次号" style="width:200px" />
      <el-button type="success" @click="executeAlloc" :disabled="currentStep >= 1">执行批量分配</el-button>
      <el-button type="warning" @click="publishResults" :disabled="currentStep < 1 || currentStep >= 2">发布预分配公示</el-button>
      <el-button type="danger" @click="finalizeResults" :disabled="currentStep < 2">确认正式分配</el-button>
      <el-button @click="loadResults">刷新结果</el-button>
    </div>

    <el-table :data="allocations" v-loading="loading" stripe>
      <el-table-column prop="studentName" label="学生" width="120" />
      <el-table-column prop="roomNumber" label="房间号" width="120" />
      <el-table-column prop="bedNo" label="床位" width="70" />
      <el-table-column label="分配方式" width="110">
        <template #default="{ row }">
          <el-tag :type="typeMap[row.allocationType]?.type || 'info'" size="small">{{ typeMap[row.allocationType]?.label || row.allocationType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ statusMap[row.status] || row.status }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
</style>
