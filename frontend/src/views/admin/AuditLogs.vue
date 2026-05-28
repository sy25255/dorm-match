<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const logs = ref<any[]>([])
const loading = ref(false)
const filterAction = ref('')

async function loadLogs() {
  loading.value = true
  try {
    const res = await adminApi.getAuditLogs(filterAction.value ? { action: filterAction.value } : undefined)
    const payload = res.data.data || {}
    logs.value = Array.isArray(payload) ? payload : payload.items || []
  } catch (error: any) {
    ElMessage.error(error?.message || '加载审计日志失败')
  } finally { loading.value = false }
}

const actionMap: Record<string, string> = {
  BATCH_ALLOCATION: '批量分配', PUBLISH_RESULTS: '发布结果', REVIEW_OBJECTION: '审核异议',
  TOGGLE_STUDENT: '启停学生', IMPORT_STUDENTS: '导入学生', UPDATE_SURVEY: '修改问卷',
  ADD_DORMITORY: '添加宿舍',
}
const roleMap: Record<string, string> = { ADMIN: '管理员', COUNSELOR: '辅导员' }

onMounted(loadLogs)
</script>

<template>
  <div>
    <div class="page-toolbar">
      <h2>审计日志</h2>
      <div style="display:flex;gap:8px">
        <el-select v-model="filterAction" placeholder="操作类型" clearable @change="loadLogs" style="width:160px">
          <el-option v-for="(label, key) in actionMap" :key="key" :label="label" :value="key" />
        </el-select>
        <el-button @click="loadLogs">刷新</el-button>
      </div>
    </div>

    <el-table :data="logs" v-loading="loading" stripe>
      <el-table-column prop="username" label="操作人" width="120" />
      <el-table-column label="角色" width="80">
        <template #default="{ row }">{{ roleMap[row.role] || row.role }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">{{ actionMap[row.action] || row.action }}</template>
      </el-table-column>
      <el-table-column prop="detail" label="详情" min-width="250" show-overflow-tooltip />
      <el-table-column prop="ipAddress" label="IP" width="140" />
      <el-table-column prop="createdAt" label="时间" width="170" />
    </el-table>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-toolbar h2 { margin: 0; font-size: 18px; }
</style>
