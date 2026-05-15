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
  } catch {
    ElMessage.error('加载分配结果失败')
  } finally { loading.value = false }
}

async function executeAlloc() {
  try {
    await ElMessageBox.confirm('确认执行批量分配？系统将根据配对和算法自动分配宿舍', '确认操作', { type: 'warning' })
  } catch {
    return
  }
  try {
    await adminApi.executeAllocation(batchCode.value)
    currentStep.value = 1
    await loadResults()
    ElMessage.success('分配执行成功')
  } catch {
    ElMessage.error('分配执行失败，请稍后重试')
  }
}

async function publishResults() {
  try {
    await ElMessageBox.confirm('确认发布预分配结果？学生将看到自己的分配信息', '确认操作', { type: 'warning' })
  } catch {
    return
  }
  try {
    await adminApi.publishResults(batchCode.value)
    currentStep.value = 2
    ElMessage.success('预分配结果已发布，学生可查看并确认/申诉')
  } catch {
    ElMessage.error('发布失败，请稍后重试')
  }
}

async function finalizeResults() {
  try {
    await ElMessageBox.confirm('确认正式分配结果？此操作不可撤销', '最终确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await adminApi.finalizeResults(batchCode.value)
    currentStep.value = 3
    ElMessage.success('正式分配结果已确认')
  } catch {
    ElMessage.error('最终确认失败，请稍后重试')
  }
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
  <div class="page-container">
    <div class="page-header">
      <h1>宿舍分配管理</h1>
      <p>管理宿舍分配的全流程：执行分配 → 查看结果 → 发布公示 → 正式确认</p>
    </div>

    <el-steps :active="currentStep" finish-status="success" style="margin-bottom:24px">
      <el-step v-for="(s, i) in steps" :key="i" :title="s" />
    </el-steps>

    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;gap:12px">
          <span>批次编号</span>
          <el-input v-model="batchCode" style="width:200px" size="small" />
          <el-button type="primary" size="small" @click="executeAlloc" :disabled="currentStep >= 1">执行分配</el-button>
          <el-button type="warning" size="small" @click="publishResults" :disabled="currentStep < 1 || currentStep >= 2">发布公示</el-button>
          <el-button type="success" size="small" @click="finalizeResults" :disabled="currentStep < 2 || currentStep >= 3">正式确认</el-button>
        </div>
      </template>

      <el-table :data="allocations" v-loading="loading" stripe>
        <el-table-column prop="roomCode" label="房间号" width="110" />
        <el-table-column prop="buildingName" label="宿舍楼" width="150" />
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column prop="studentNo" label="学号" width="120" />
        <el-table-column label="分配方式" width="100">
          <template #default="{ row }">
            <el-tag :type="(typeMap[row.allocationType]?.type || 'info') as any" size="small">
              {{ typeMap[row.allocationType]?.label || row.allocationType || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            {{ statusMap[row.status] || row.status || '未知' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page-container { min-height: calc(100vh - 48px); }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 22px; font-weight: 600; margin: 0 0 4px; }
.page-header p { font-size: 13px; color: #86909c; margin: 0; }
</style>