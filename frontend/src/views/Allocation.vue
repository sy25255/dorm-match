<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { allocationApi } from '@/api/invite'
import { ElMessage, ElMessageBox } from 'element-plus'

const allocation = ref<any>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await allocationApi.getMyAllocation()
    allocation.value = res.data.data
  } catch {} finally {
    loading.value = false
  }
})

async function confirmAllocation() {
  try {
    await allocationApi.confirm()
    ElMessage.success('已确认分配结果')
    allocation.value.confirmedByStudent = 1
  } catch {}
}

async function submitObjection() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入申诉理由', '提交异议', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请详细描述您的申诉理由...',
    })
    if (reason) {
      await allocationApi.submitObjection(reason)
      ElMessage.success('异议已提交，请等待处理')
    }
  } catch {}
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1>宿舍分配结果</h1>
      <p>查看您的宿舍分配情况</p>
    </div>

    <div v-loading="loading">
      <el-empty v-if="!allocation" description="暂无分配结果，请等待管理员分配" />

      <template v-else>
        <el-card class="allocation-card">
          <el-descriptions title="分配详情" :column="2" border>
            <el-descriptions-item label="房间号">{{ allocation.roomNumber }}</el-descriptions-item>
            <el-descriptions-item label="床位号">{{ allocation.bedNo }}号床</el-descriptions-item>
            <el-descriptions-item label="分配方式">
              <el-tag :type="allocation.allocationType === 'SELF_SELECT' ? 'success' : 'info'">
                {{ allocation.allocationType === 'SELF_SELECT' ? '自主选择' : '系统分配' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="allocation.status === 'CONFIRMED' ? 'success' : 'warning'">
                {{ allocation.status === 'CONFIRMED' ? '已确认' : '待确认' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="allocation.roommates?.length" class="roommate-list">
            <h3>你的舍友</h3>
            <div class="roommate-grid">
              <div v-for="r in allocation.roommates" :key="r.studentId" class="roommate-item">
                <el-avatar :size="48">{{ r.name?.charAt(0) }}</el-avatar>
                <span>{{ r.name }}</span>
                <span class="bed-tag">{{ r.bedNo }}号床</span>
              </div>
            </div>
          </div>

          <div v-if="!allocation.confirmedByStudent" class="allocation-actions">
            <el-button type="primary" @click="confirmAllocation">确认无异议</el-button>
            <el-button type="warning" @click="submitObjection">提交异议</el-button>
          </div>
        </el-card>
      </template>
    </div>
  </div>
</template>

<style scoped>
.allocation-card {
  max-width: 700px;
}

.roommate-list {
  margin-top: 24px;
}

.roommate-list h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.roommate-grid {
  display: flex;
  gap: 24px;
}

.roommate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bed-tag {
  font-size: 12px;
  color: #86909c;
}

.allocation-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
